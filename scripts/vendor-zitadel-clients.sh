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

if ! git rev-parse --verify --quiet "$version^{commit}" >/dev/null; then
  echo "Fetch the ZITADEL tag $version before generating clients" >&2
  exit 1
fi

build_root="$(mktemp -d)"
source_dir="$build_root/source"

cleanup() {
  git worktree remove --force "$source_dir" >/dev/null 2>&1 || true
  rmdir "$build_root" >/dev/null 2>&1 || true
}
trap cleanup EXIT INT TERM

git worktree add --detach "$source_dir" "$version" >/dev/null
(
  cd "$source_dir"
  npx --yes pnpm@10.28.2 install --frozen-lockfile --filter @zitadel/proto... --filter @zitadel/client...
  npx --yes pnpm@10.28.2 --dir packages/zitadel-proto generate
  npx --yes pnpm@10.28.2 --dir packages/zitadel-client build
)

git rm -r --ignore-unmatch vendor/zitadel-client vendor/zitadel-proto >/dev/null
mkdir -p vendor/zitadel-client vendor/zitadel-proto
cp -R "$source_dir/packages/zitadel-client/dist" vendor/zitadel-client/
cp "$source_dir/packages/zitadel-client/package.json" vendor/zitadel-client/package.json
cp -R \
  "$source_dir/packages/zitadel-proto/cjs" \
  "$source_dir/packages/zitadel-proto/es" \
  "$source_dir/packages/zitadel-proto/types" \
  vendor/zitadel-proto/
cp "$source_dir/packages/zitadel-proto/package.json" vendor/zitadel-proto/package.json

client_version="${version#v}-fos.0"
node - "$client_version" <<'NODE'
import fs from "node:fs";

const version = process.argv[2];
const clientPath = "vendor/zitadel-client/package.json";
const protoPath = "vendor/zitadel-proto/package.json";
const client = JSON.parse(fs.readFileSync(clientPath, "utf8"));
const proto = JSON.parse(fs.readFileSync(protoPath, "utf8"));

client.version = version;
client.dependencies["@zitadel/proto"] = "file:../zitadel-proto";
proto.version = version;

fs.writeFileSync(clientPath, `${JSON.stringify(client, null, 2)}\n`);
fs.writeFileSync(protoPath, `${JSON.stringify(proto, null, 2)}\n`);
NODE

git add vendor/zitadel-client vendor/zitadel-proto
echo "Vendored ZITADEL TypeScript clients for $version"
