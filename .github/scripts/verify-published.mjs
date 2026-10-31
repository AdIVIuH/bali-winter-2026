import { readFileSync } from 'node:fs'
import path from 'node:path'
import { setTimeout } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'

export async function verifyPublished({ expected, pageUrl, get = fetch, wait = setTimeout, attempts = 18 }) {
  if (!/^[0-9a-f]{40}$/.test(expected)) throw new Error('Invalid source revision')
  const base = new URL(pageUrl)
  if (base.protocol !== 'https:' || base.hostname !== 'adiviuh.github.io') throw new Error('Unexpected Pages URL')
  if (!base.pathname.endsWith('/')) base.pathname += '/'
  const revisionUrl = new URL('build-revision.txt', base)
  revisionUrl.searchParams.set('revision', expected)

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const revision = await get(revisionUrl, { signal: AbortSignal.timeout(10_000) })
      if (revision.ok && (await revision.text()).trim() === expected) {
        const page = await get(base, { signal: AbortSignal.timeout(10_000) })
        if (page.ok) return
      }
    } catch {
      // Pages and its CDN may take time to serve the new artifact.
    }
    if (attempt < attempts - 1) await wait(10_000)
  }
  throw new Error('Published revision did not become available in time')
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const expected = readFileSync('build-revision.txt', 'utf8').trim()
  await verifyPublished({ expected, pageUrl: process.env.PAGE_URL })
  console.log(`Published revision ${expected} is available`)
}
