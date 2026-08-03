# FOS ZITADEL Login App Guide

## Context

This repository is a standalone fork of ZITADEL's `apps/login`. Authentication logic follows upstream ZITADEL; FOS-specific presentation belongs in shared UI components such as `src/components/dynamic-theme.tsx`.

## Technology and conventions

- Next.js App Router and React with TypeScript.
- Tailwind CSS, configured in `tailwind.config.mjs`.
- ZITADEL APIs through the release-matched generated clients in `vendor/`.
- Preserve upstream session, OIDC, SAML, IdP, enrollment, and security behavior when resolving sync conflicts.

## Verification

- Development: `pnpm dev`
- Lint: `pnpm lint-check-next` and `pnpm lint-check-prettier`
- Type check: `pnpm typecheck`
- Unit tests: `pnpm test-unit`
- Production build: `pnpm build`
- Container: `docker build -t fos-zitadel-login .`

## Changelog discipline

- Keep `docs/releases/unreleased.md` updated in the same change whenever code is modified.
- Stage the release-note entry with the code and prefer `boo commit` so commit messages follow repository conventions.
- For changes that intentionally do not need release notes, use `boo commit -m "subject"` with an explicit subject.
