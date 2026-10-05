import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  timeout: 45_000,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:4321',
    browserName: 'chromium',
    channel: 'chromium',
    reducedMotion: 'reduce',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: { args: ['--use-angle=swiftshader-webgl', '--enable-unsafe-swiftshader'] },
  },
  projects: [
    { name: 'phone', use: { viewport: { width: 390, height: 844 } } },
    { name: 'laptop', use: { viewport: { width: 1440, height: 900 } } },
    { name: 'ultrawide', use: { viewport: { width: 2560, height: 1080 } } },
  ],
  webServer: {
    command: 'pnpm preview:browser',
    url: 'http://127.0.0.1:4321',
    reuseExistingServer: !process.env.CI,
  },
})
