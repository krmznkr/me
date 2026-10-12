import assert from 'node:assert/strict'
import { test } from 'node:test'
import worker from './index.ts'

test('redirects the root domain over HTTPS, preserving path and query', async () => {
  for (const protocol of ['http:', 'https:']) {
    const response = await worker.fetch(new Request(`${protocol}//krmznkr.com/projects?from=github`), {
      ASSETS: { fetch: async () => { throw new Error('Unexpected asset request') } },
    })
    assert.equal(response.status, 301)
    assert.equal(response.headers.get('location'), 'https://me.krmznkr.com/projects?from=github')
  }
})

test('serves homepage assets without redirecting', async () => {
  const asset = new Response('homepage')
  const response = await worker.fetch(new Request('https://me.krmznkr.com/'), {
    ASSETS: { fetch: async () => asset },
  })
  assert.equal(response, asset)
})
