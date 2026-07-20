const PROJECT_TOKEN = 'phc_mptDs49YvTafSLXfgGhpUvHeEDq7uNVaiMcd3VyTiN8j'

function sanitizeUrl(value: unknown): unknown {
  if (typeof value !== 'string') return value

  try {
    const url = new URL(value)
    return `${url.origin}${url.pathname}`
  } catch {
    return value.split(/[?#]/, 1)[0]
  }
}

async function initializePostHog() {
  const { default: posthog } = await import('posthog-js/dist/module.slim')

  posthog.init(PROJECT_TOKEN, {
    api_host: 'https://eu.i.posthog.com',
    ui_host: 'https://eu.posthog.com',
    defaults: '2026-05-30',
    autocapture: false,
    capture_pageview: 'history_change',
    capture_pageleave: true,
    capture_dead_clicks: false,
    capture_exceptions: false,
    capture_heatmaps: false,
    capture_performance: false,
    disable_session_recording: true,
    disable_surveys: true,
    disable_persistence: true,
    person_profiles: 'identified_only',
    respect_dnt: true,
    advanced_disable_feature_flags: true,
    mask_all_text: true,
    mask_all_element_attributes: true,
    before_send: (event) => {
      if (!event) return event

      const properties: Record<string, unknown> = {
        ...event.properties,
        app: 'me',
        environment: import.meta.env.MODE,
      }

      return {
        ...event,
        properties: {
          ...properties,
          $current_url: sanitizeUrl(properties.$current_url),
          $referrer: sanitizeUrl(properties.$referrer),
        },
      }
    },
  })

  return posthog
}

const postHogClient = import.meta.env.PROD
  ? initializePostHog().catch(() => null)
  : Promise.resolve(null)

export function capturePostHogEvent(event: string, properties?: Record<string, unknown>) {
  void postHogClient
    .then((posthog) => posthog?.capture(event, properties))
    .catch(() => undefined)
}
