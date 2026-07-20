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

## Releases and source maps

The Deploy workflow supplies two build-only environment variables:

- `SENTRY_AUTH_TOKEN` comes from the GitHub Actions repository secret.
- `SENTRY_RELEASE` is the full Git commit SHA from `github.sha`.

When the token is present, `astro.config.mjs` creates the release, associates
its commits, generates hidden source maps, uploads an artifact bundle, and
deletes the map files from `dist` before Cloudflare deployment. Local builds do
not upload anything because they do not normally receive the token.

The GitHub App is installed only for the `julian`, `life`, and `me`
repositories.

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

## Verify the integration

After a push to `main`:

1. Confirm both the CI and Deploy workflows succeeded.
2. Check that the commit SHA appears under Sentry Releases for `me`.
3. Confirm the Deploy log says that source maps were uploaded successfully.
4. Check the Sentry Issues feed after exercising the deployed application.

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
