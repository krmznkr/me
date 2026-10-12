import { expect, test } from '@playwright/test'

// Software WebGL on shared runners should not spend every CPU on a 60fps loop.
// This is a rendering/interaction check, not an animation performance benchmark.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.requestAnimationFrame = callback => window.setTimeout(() => callback(performance.now()), 200)
    window.cancelAnimationFrame = id => window.clearTimeout(id)
  })
})

test('homepage renders its model, links and motion control without overflow or telemetry', async ({ page }, info) => {
  const errors: string[] = []
  const externalRequests: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('request', request => {
    if (!request.url().startsWith('http://127.0.0.1:4321/') && !request.url().startsWith('data:')) {
      externalRequests.push(request.url())
    }
  })
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'krmznkr', exact: true })).toBeVisible()
  for (const [name, url] of [
    ['GitHub', 'https://github.com/krmznkr'],
    ['Julian', 'https://julian.krmznkr.com'],
    ['Life', 'https://life.krmznkr.com'],
    ['Source code', 'https://github.com/krmznkr/me'],
  ]) {
    await expect(page.getByRole('link', { name, exact: true })).toHaveAttribute('href', url)
  }
  const motion = page.locator('.motion-control')
  await expect(motion).toBeEnabled({ timeout: 60_000 })
  if ((page.viewportSize()?.width ?? 0) <= 700) {
    // The existing mobile design intentionally hides this desktop control.
    await expect(motion).toBeHidden()
  } else {
    await expect(motion).toBeVisible()
    await motion.click()
    await expect(page.getByRole('button', { name: 'Resume animation' })).toHaveAttribute('aria-pressed', 'true')
  }
  await page.evaluate(() => document.fonts.ready)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.screenshot({ path: info.outputPath('review.png'), fullPage: true })
  await info.attach('Visual review', { path: info.outputPath('review.png'), contentType: 'image/png' })
  expect(errors).toEqual([])
  expect(externalRequests).toEqual([])
})

test('reduced motion renders the model with its manual pause control hidden', async ({ page }, info) => {
  await page.goto('/')
  await expect(page.locator('.motion-control')).toBeEnabled({ timeout: 60_000 })
  await expect(page.locator('.motion-control')).toBeHidden()
  await expect(page.locator('html')).not.toHaveClass(/scene-error/)
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: info.outputPath('reduced-motion.png'), fullPage: true })
})

test('text and links remain usable without JavaScript', async ({ browser }, info) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: info.project.use.viewport })
  const page = await context.newPage()
  await page.goto('http://127.0.0.1:4321/')
  await expect(page.getByRole('heading', { name: 'krmznkr', exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Source code' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.screenshot({ path: info.outputPath('no-javascript.png'), fullPage: true })
  await context.close()
})
