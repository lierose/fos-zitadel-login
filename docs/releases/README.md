# Release notes

1. Add a concise bullet to `docs/releases/unreleased.md` while developing.
2. Stage the code and release-note change.
3. Run `boo commit` to draft a conventional commit message from the staged diff.

For changes that intentionally do not need a release-note entry, use
`boo commit -m "your commit subject"`. Use `boo commit -a` to stage all current
changes before committing.
