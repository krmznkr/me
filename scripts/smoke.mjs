import assert from 'node:assert/strict'

const origin = process.argv[2] || 'https://me.krmznkr.com'
assert.match(origin, /^https:\/\/[a-z0-9.-]+$/)
const response = await fetch(origin, { signal: AbortSignal.timeout(30_000) })
assert.equal(response.status, 200, `Homepage returned ${response.status}`)
const html = await response.text()
assert.match(html, /krmznkr \| Full-stack software engineer/)
assert.match(html, /rel="canonical" href="https:\/\/me\.krmznkr\.com"/)
for (const url of ['https://github.com/krmznkr', 'https://julian.krmznkr.com', 'https://life.krmznkr.com']) {
  assert.ok(html.includes(`href="${url}"`), `Missing ${url}`)
}
assert.equal(response.headers.get('x-content-type-options'), 'nosniff')
assert.ok(response.headers.get('content-security-policy')?.includes("script-src 'self'"))
const model = await fetch(`${origin}/models/hyperion.glb`, { signal: AbortSignal.timeout(30_000) })
assert.equal(model.status, 200)
if (origin === 'https://me.krmznkr.com') {
  const redirect = await fetch('https://krmznkr.com/review-smoke?source=ci', { redirect: 'manual', signal: AbortSignal.timeout(30_000) })
  assert.equal(redirect.status, 301)
  assert.equal(redirect.headers.get('location'), 'https://me.krmznkr.com/review-smoke?source=ci')
}
console.log(`Smoke checks passed: ${origin}`)
