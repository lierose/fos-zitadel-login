/**
 * Prefix a file from public/ with the base path compiled into the Next.js app.
 * Raw img src attributes are not automatically adjusted by Next.js.
 */
export function publicAssetPath(path: string): string {
  const basePath = (process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/$/, "");
  const assetPath = path.startsWith("/") ? path : `/${path}`;

  return `${basePath}${assetPath}`;
}
