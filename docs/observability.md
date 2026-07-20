# Observability

Me uses [Sentry](https://krmznkr.sentry.io/) for production browser error
tracking, performance traces, session replay, releases, and source maps. The
Sentry project slug is `me` in the `krmznkr` organization.

## Runtime monitoring

`src/scripts/sentry.ts` initializes `@sentry/browser` only in production
builds. The current data controls are:

- default personally identifiable information is not sent;
- replay masks all text and blocks all media;
- 20% of performance traces are sampled;
- 5% of ordinary sessions are eligible for replay; and
- sessions containing an error are eligible for replay.

Unhandled browser errors and promise rejections are captured by the SDK. The
DSN in `src/scripts/sentry.ts` is a public client identifier. It is safe to ship
in the browser bundle and must not be treated like an API token.

## PostHog traffic analytics

`src/scripts/posthog.ts` lazily loads PostHog's slim browser bundle in
production only. It sends page views and page leaves to the EU-hosted
`krmznkr apps` project (project ID `228794`) with `app=me` and
`environment=production` on every event. One shared project is intentional: the
free plan supports one project, so each app is separated by the `app` property
without adding billing.

The integration is deliberately cookieless and content-minimizing:

- persistence, person identification, autocapture, session recording, surveys,
  heatmaps, exception capture, dead-click capture, performance capture, and
  feature-flag requests are disabled;
- browser Do Not Track is respected;
- text and sensitive element attributes are masked; and
- query strings and URL fragments are removed from current and referrer URLs.

The project token in `src/scripts/posthog.ts` is a public ingestion identifier.
The personal API key is secret and must never be committed or copied into GitHub
Actions. Sentry remains the error tracker and source-map destination.

Me records `outbound_link_clicked` for the four explicitly tagged external
links. It sends only a static `destination` label: `github`, `julian`, `life`,
or `source`. Link text and destination URLs are not captured as custom
properties. The shared
[Apps · Traffic & Engagement dashboard](https://eu.posthog.com/project/228794/dashboard/836241)
shows rolling 30-day pageviews, sanitized paths, referrers, and key interactions
for all three apps. Every query is restricted to `environment=production` and
can be narrowed with the `app` property. Because persistence is disabled, the
dashboard intentionally avoids stable-user and unique-visitor metrics.

## Releases and source maps

The Deploy workflow supplies two build-only environment variables:

- `SENTRY_AUTH_TOKEN` comes from the GitHub Actions repository secret.
- `SENTRY_RELEASE` is the full Git commit SHA from `github.sha`.

When the token is present, `astro.config.mjs` creates the release, associates
its commits, generates hidden source maps, uploads an artifact bundle, and
deletes the map files from `dist` before Cloudflare deployment. Local builds do
not upload anything because they do not normally receive the token.

The Sentry GitHub App is installed only for the `julian`, `life`, and `me`
repositories. The PostHog EU GitHub App has the same repository restriction.

## CLI access

The auth token is stored in the Private 1Password vault as `Sentry (krmznkr)`.
The 1Password Sentry CLI shell plugin injects it into `sentry-cli`; the token is
not stored in `.sentryclirc`. Open a new interactive shell, then run:

```sh
sentry-cli info
sentry-cli releases list --show-projects
```

The committed `.sentryclirc` contains only the non-secret organization, project,
and SaaS URL defaults.

PostHog CLI `0.8.4` is installed globally. The `posthog-cli` shell function in
`~/.zshrc` reads the credential from the Private-vault item
`PostHog (krmznkr)` and supplies the EU host and shared project ID without
persisting the key. In a new interactive shell, verify it with:

```sh
posthog-cli --version
posthog-cli api call --json project-get '{}'
```

## Verify the integration

After a push to `main`:

1. Confirm both the CI and Deploy workflows succeeded.
2. Check that the commit SHA appears under Sentry Releases for `me`.
3. Confirm the Deploy log says that source maps were uploaded successfully.
4. Check the Sentry Issues feed after exercising the deployed application.
5. Open [PostHog Activity](https://eu.posthog.com/project/228794/activity/explore)
   or Web analytics, filter `app` to `me`, and confirm `$pageview` events.

The initial installation was verified with the issue `ME-1`, titled
`Sentry setup verification`.

## Rotate the auth token

Create a replacement Sentry personal token with these scopes:
`org:read`, `project:admin`, `project:read`, `project:releases`, `project:write`,
and `team:read`. Then update 1Password and the three GitHub repository secrets
without printing the token:

```zsh
read -rs "sentry_token_value?New Sentry token: "
echo
op item edit "Sentry (krmznkr)" --vault Private \
  "token[password]=$sentry_token_value" >/dev/null
for repository in julian life me; do
  printf %s "$sentry_token_value" | \
    gh secret set SENTRY_AUTH_TOKEN --repo "krmznkr/$repository"
done
unset sentry_token_value
```

Verify `sentry-cli info` in a new shell, run one deployment, and revoke the old
token only after the new release and source-map upload succeed.

For PostHog, create a replacement personal key with the `Agent CLI` preset and
access to all projects in the `krmznkr` organization. Store it without printing
it, verify the CLI, and only then revoke the previous key:

```zsh
read -rs "posthog_token_value?New PostHog token: "
echo
op item edit "PostHog (krmznkr)" --vault Private \
  "credential[password]=$posthog_token_value" >/dev/null
unset posthog_token_value
posthog-cli api call --json project-get '{}'
```
