# FOS ZITADEL Login

Standalone FOS login UI based on ZITADEL Login V2. The repository contains the login application and the two generated TypeScript API clients required to compile it; ZITADEL's authentication and security changes are merged from release tags while the FOS design is maintained in a shared presentation layer.

The current upstream baseline is recorded in `.zitadel-upstream`.

The generated clients under `vendor/` match that exact release. ZITADEL does not currently publish compatible npm packages for the latest Login V2 source, so they are intentionally vendored instead of depending on the rest of the monorepo.

## Development

Requirements: Node.js 24 and pnpm 10.28.2.

```sh
npm install --global pnpm@10.28.2
pnpm install --frozen-lockfile
pnpm dev
```

Configure `ZITADEL_API_URL` and one supported login-client credential in `.env.local`. See `next-env-vars.d.ts` for all runtime settings. The FOS application tiles use:

- `NEXT_PUBLIC_FOS_URL` and optional `NEXT_PUBLIC_FOS_NAME`
- `NEXT_PUBLIC_APP2_URL` and optional `NEXT_PUBLIC_APP2_NAME`

The UI is served from `/` by default. Set `NEXT_PUBLIC_BASE_PATH` at build time only when it must be mounted below another path.

## Verification and container

```sh
pnpm lint-check-next
pnpm lint-check-prettier
pnpm typecheck
pnpm test-unit
pnpm build
docker build -t fos-zitadel-login .
```

The container exposes port 3000 and provides `/healthy` and `/ready` probes.

## Updating from ZITADEL

Run the sync script from a clean `main` branch and pass an explicit stable ZITADEL tag:

```sh
./scripts/sync-zitadel-login.sh v4.17.0
```

The script fetches the official tag, extracts only `apps/login`, creates `sync/zitadel-login-<version>`, merges the extracted history, and regenerates the two API clients from the same tag. Resolve any conflicts with upstream authentication logic taking precedence and the FOS presentation remaining in shared UI components. If the merge stops for conflicts, commit the resolution and run `./scripts/vendor-zitadel-clients.sh <tag>` before verification. Run all checks, push the sync branch, and merge it through a pull request. No permanent upstream branch is required.

The third-party `upstream/LOGIN` commit `90187c0475b3962d0a7086e6df2fee82ec388d84` was reviewed but intentionally not imported. Its Docker Compose setup targets the former monorepo, its header parsing and MFA changes are already superseded by v4.16.2, and its unconditional registration disablement would override ZITADEL's configured registration policy.

## Recovery

The pre-migration monorepo state is preserved in the tags:

- `archive/full-fork-before-standalone-20260803`
- `archive/origin-main-before-standalone-20260803`
