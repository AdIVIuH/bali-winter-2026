import test from 'node:test'
import assert from 'node:assert/strict'
import { verifyPublished } from './verify-published.mjs'

const expected = 'a'.repeat(40)
const pageUrl = 'https://adiviuh.github.io/bali-winter-2026'
const wait = async () => {}

test('waits for the matching revision and checks the site page', async () => {
  let calls = 0
  await verifyPublished({ expected, pageUrl, wait, get: async (url) => {
    calls++
    if (url.pathname.endsWith('build-revision.txt')) return { ok: true, text: async () => calls === 1 ? 'old' : expected }
    assert.equal(url.pathname, '/bali-winter-2026/')
    return { ok: true }
  } })
  assert.equal(calls, 3)
})

test('fails if the expected revision never appears', async () => {
  await assert.rejects(verifyPublished({ expected, pageUrl, wait, attempts: 2, get: async () => ({ ok: true, text: async () => 'old' }) }), /did not become available/)
})

test('rejects an untrusted deployment URL or malformed revision', async () => {
  await assert.rejects(verifyPublished({ expected, pageUrl: 'https://example.com/' }), /Unexpected Pages URL/)
  await assert.rejects(verifyPublished({ expected: 'not-a-sha', pageUrl }), /Invalid source revision/)
})
