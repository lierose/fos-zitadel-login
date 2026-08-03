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

Direct Docker builds serve the UI from `/` by default. The Makefile defaults
`BASE_PATH` to IFA's `/ui/v2/login` deployment path. This passes
`NEXT_PUBLIC_BASE_PATH` into the Next.js build; setting it only when the
container starts cannot change the compiled routes. Use `BASE_PATH=` explicitly
for a root-mounted image.

## Verification and container

```sh
pnpm lint-check-next
pnpm lint-check-prettier
pnpm typecheck
pnpm test-unit
pnpm build
make image
make smoke
```

The container exposes port 3000 and provides `/healthy` and `/ready` probes.

The default image reference is `registry.liero.se/ifa-zitadel-login-v2:latest` (a slash is required between registry and repository). Local builds also receive an architecture-specific `git-<sha>-<arch>` tag. Override the defaults when needed:

```sh
make image TAG=v4.16.2 PLATFORM=linux/amd64
make image TAG=v4.16.2 BASE_PATH=
make image-arm64 TAG=v4.16.2
make smoke-arm64 TAG=v4.16.2
make push TAG=v4.16.2
```

`make push` requires an authenticated Docker client. It builds a multi-architecture manifest for `linux/amd64` and `linux/arm64`, then pushes both the selected tag and the Git SHA tag. Override `PLATFORMS` to change that set.

## ZITADEL Login V2 URL

Makefile-built images use `BASE_PATH=/ui/v2/login` unless overridden. A direct
Docker build or `make image BASE_PATH=` serves `/healthy` and `/ready` at the
root; the normal IFA build serves those probes and all login routes below
`/ui/v2/login`.

Configure the ZITADEL instance-level Login V2 feature `BaseURI`, or the application's custom Login V2 base URL, to the full public root URL of this service. For example:

```yaml
DefaultInstance:
  Features:
    LoginV2:
      Required: true
      BaseURI: https://login.example.se
```

The equivalent environment variable for defaults on a new instance is:

```sh
ZITADEL_DEFAULTINSTANCE_FEATURES_LOGINV2_BASEURI=https://login.example.se
```

For an existing instance, update Login V2 through Console or the Feature API. Do not leave the base URI empty: that selects ZITADEL's built-in `/ui/v2/login` path. External IdP routing must use the public login domain's `/idps/callback` endpoint.

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
