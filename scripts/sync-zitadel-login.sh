#!/bin/sh
set -eu

if [ "$#" -ne 1 ]; then
  echo "Usage: $0 <zitadel-release-tag>" >&2
  exit 2
fi

version="$1"
case "$version" in
  v[0-9]*.[0-9]*.[0-9]*) ;;
  *)
    echo "Expected a stable release tag such as v4.17.0" >&2
    exit 2
    ;;
esac

if [ "$(git branch --show-current)" != "main" ]; then
  echo "Run this script from main" >&2
  exit 1
fi

if [ -n "$(git status --porcelain)" ]; then
  echo "Working tree must be clean" >&2
  exit 1
fi

if ! git remote get-url zitadel >/dev/null 2>&1; then
  git remote add zitadel https://github.com/zitadel/zitadel.git
fi

git fetch --no-tags zitadel "refs/tags/$version:refs/tags/$version"
upstream_commit="$(git rev-list -n 1 "$version")"
split_branch="upstream-login-${version#v}"
sync_branch="sync/zitadel-login-${version#v}"

if git show-ref --verify --quiet "refs/heads/$split_branch" || git show-ref --verify --quiet "refs/heads/$sync_branch"; then
  echo "A temporary branch for $version already exists" >&2
  exit 1
fi

git subtree split -q --prefix=apps/login "$version" -b "$split_branch"
git switch -c "$sync_branch" main

if ! git merge --no-ff "$split_branch" -m "merge: update standalone login to ZITADEL $version"; then
  echo "Resolve and commit the merge, then run ./scripts/vendor-zitadel-clients.sh $version and update .zitadel-upstream." >&2
  exit 1
fi

./scripts/vendor-zitadel-clients.sh "$version"
printf 'tag=%s\ncommit=%s\nsubtree=apps/login\n' "$version" "$upstream_commit" > .zitadel-upstream
git add .zitadel-upstream vendor/zitadel-client vendor/zitadel-proto
git commit -m "chore: record ZITADEL $version upstream baseline"
git branch -D "$split_branch"

echo "Created $sync_branch. Run the verification suite, push it, and open a pull request."
