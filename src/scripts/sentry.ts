import * as Sentry from '@sentry/browser'

if (import.meta.env.PROD) {
  Sentry.init({
    dsn: 'https://e0ff242475ead4c302e8c1d4ea0dce6a@o4511769287000064.ingest.de.sentry.io/4511769331957840',
    environment: import.meta.env.MODE,
    sendDefaultPii: false,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    tracesSampleRate: 0.2,
    replaysSessionSampleRate: 0.05,
    replaysOnErrorSampleRate: 1,
  })
}
