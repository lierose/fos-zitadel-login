import { afterEach, describe, expect, test } from "vitest";
import { publicAssetPath } from "./public-asset-path";

const originalBasePath = process.env.NEXT_PUBLIC_BASE_PATH;

afterEach(() => {
  if (originalBasePath === undefined) {
    delete process.env.NEXT_PUBLIC_BASE_PATH;
  } else {
    process.env.NEXT_PUBLIC_BASE_PATH = originalBasePath;
  }
});

describe("publicAssetPath", () => {
  test("keeps assets at the root when no base path is configured", () => {
    delete process.env.NEXT_PUBLIC_BASE_PATH;

    expect(publicAssetPath("/logo.svg")).toBe("/logo.svg");
  });

  test("prefixes assets with the configured base path", () => {
    process.env.NEXT_PUBLIC_BASE_PATH = "/ui/v2/login";

    expect(publicAssetPath("/logo.svg")).toBe("/ui/v2/login/logo.svg");
  });

  test("normalizes the separator", () => {
    process.env.NEXT_PUBLIC_BASE_PATH = "/ui/v2/login/";

    expect(publicAssetPath("logo.svg")).toBe("/ui/v2/login/logo.svg");
  });
});
