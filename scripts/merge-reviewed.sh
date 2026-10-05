#!/usr/bin/env bash
# Merge only the commit inspected in the browser, after its checks pass.
set -euo pipefail
[[ $# == 2 && $1 =~ ^[0-9]+$ && $2 =~ ^[a-f0-9]{40}$ ]] || {
  echo 'Usage: scripts/merge-reviewed.sh PR_NUMBER REVIEWED_HEAD_SHA' >&2; exit 2;
}
[[ $(gh api user --jq .login) == krmznkr ]] || { echo 'Authenticate as krmznkr for this repository.' >&2; exit 1; }
[[ $(git remote get-url origin) =~ github.com[:/]krmznkr/me(\.git)?$ ]] || { echo 'Wrong repository.' >&2; exit 1; }
metadata="$(gh pr view "$1" --repo krmznkr/me --json headRefOid,state,isDraft,reviewDecision)"
[[ $(jq -r .headRefOid <<< "$metadata") == "$2" ]] || { echo 'PR head changed; review its new preview.' >&2; exit 1; }
[[ $(jq -r .state <<< "$metadata") == OPEN && $(jq -r .isDraft <<< "$metadata") == false ]] || { echo 'PR is not ready.' >&2; exit 1; }
case "$(jq -r .reviewDecision <<< "$metadata")" in
  CHANGES_REQUESTED|REVIEW_REQUIRED) echo 'Required review is unresolved.' >&2; exit 1 ;;
esac
gh pr checks "$1" --repo krmznkr/me
# Pinning closes the race between successful checks and the merge request.
gh pr merge "$1" --repo krmznkr/me --squash --match-head-commit "$2"
