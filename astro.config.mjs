// @ts-check
import { sentryVitePlugin } from '@sentry/vite-plugin'
import { defineConfig } from 'astro/config'

const runtimeEnv = /** @type {any} */ (globalThis).process.env
const sentryAuthToken = runtimeEnv.SENTRY_AUTH_TOKEN
const sentryRelease = runtimeEnv.SENTRY_RELEASE
const sentryPlugin = sentryAuthToken
  ? sentryVitePlugin({
      authToken: sentryAuthToken,
      org: 'krmznkr',
      project: 'me',
      telemetry: false,
      sourcemaps: {
        filesToDeleteAfterUpload: './dist/**/*.map',
      },
      release: sentryRelease
        ? {
            name: sentryRelease,
            setCommits: { auto: true, ignoreMissing: true },
          }
        : undefined,
    })
  : undefined

// https://astro.build/config
export default defineConfig({
  site: 'https://me.krmznkr.com',
  compressHTML: true,
  build: {
    inlineStylesheets: 'always',
  },
  vite: {
    plugins: [sentryPlugin],
    build: {
      sourcemap: sentryPlugin ? 'hidden' : false,
      // Keep every script external so the strict CSP (script-src 'self')
      // never has to allow inline scripts.
      assetsInlineLimit: 0,
    },
  },
})
