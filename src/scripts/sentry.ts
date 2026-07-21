import * as Sentry from '@sentry/browser'

function pathOnly(value: string | undefined): string | undefined {
  if (!value) return value
  try {
    const url = new URL(value)
    return `${url.origin}${url.pathname}`
  } catch {
    return value.split(/[?#]/, 1)[0]
  }
}

if (import.meta.env.PROD) {
  Sentry.init({
    dsn: 'https://e0ff242475ead4c302e8c1d4ea0dce6a@o4511769287000064.ingest.de.sentry.io/4511769331957840',
    environment: import.meta.env.MODE,
    sendDefaultPii: false,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 0.05,
    beforeSend: (event) => ({
      ...event,
      user: undefined,
      request: event.request
        ? {
            ...event.request,
            url: pathOnly(event.request.url),
            query_string: undefined,
            cookies: undefined,
            headers: undefined,
            data: undefined,
          }
        : undefined,
    }),
    beforeSendTransaction: (event) => ({
      ...event,
      request: event.request
        ? {
            ...event.request,
            url: pathOnly(event.request.url),
            query_string: undefined,
            cookies: undefined,
            headers: undefined,
            data: undefined,
          }
        : undefined,
    }),
    beforeSendSpan: (span) => {
      if (typeof span.description === 'string') {
        span.description = pathOnly(span.description)
      }
      if (span.data) {
        for (const key of [
          'http.url',
          'http.query',
          'http.fragment',
          'url.query',
          'url.fragment',
          'url.full',
        ]) {
          if (key in span.data) delete span.data[key]
        }
        const full = span.data['url.path'] ?? span.data['server.address']
        if (typeof full === 'string') {
          span.data['url.path'] = pathOnly(full)
        }
      }
      return span
    },
  })
}
