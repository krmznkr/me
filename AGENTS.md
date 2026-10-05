# Agent workflow

This is the public `krmznkr/me` repository. Use the `krmznkr` GitHub identity
and this repository's public Cloudflare account; never borrow private or work
credentials. Check `gh api user --jq .login` before every GitHub write.
Credentials stay in 1Password and repository secrets, never in source or PRs.

Read `CONTRIBUTING.md` and `docs/development.md` before changing files.
Every change starts in a fresh sibling worktree from fetched `origin/main`.
Keep the primary checkout on main. Use Node 24.15.0 and pnpm 10.33.0.
Run `pnpm install --frozen-lockfile`, install Playwright Chromium when needed,
and run `pnpm review`; check a normal production build with `pnpm build` too.

Use the connected client's browser preview for local work. PR previews are
public, contain only this public site, and require no VPN or local client
installation. Inspect the exact-version preview and CI screenshots before
merging; record the inspected head SHA and viewports in the PR. Browser checks
capture review evidence; they do not replace judgment about the composition.

Push the branch and open a PR. Link it to the active coding thread when that
integration exists, and open it in the client's browser. Watch CI and preview
checks, fix failures, then run `scripts/merge-reviewed.sh <number> <reviewed-sha>`.
Never merge a head different from the one visually reviewed. Required GitHub
reviews must be resolved; do not bypass protection or use `--admin`.

Production deployment belongs to the Deploy workflow on main. Wait for it and
its smoke check before declaring delivery complete. Do not manually deploy or
copy credentials between identities. Confirm the final content on origin/main,
then remove the disposable worktree and local branch. Preserve a blocked
worktree and report the exact blocker if a required review or outage intervenes.

Keep docs current, pin workflow actions, and keep generated browser reports,
screenshots, build output, and personal information out of commits.
