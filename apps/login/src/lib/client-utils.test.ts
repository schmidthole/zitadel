import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { handleServerActionResponse, isExternalUrl, isSafeRedirectUri } from "./client-utils";

describe("isSafeRedirectUri", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("should reject empty uri", async () => {
    expect(await isSafeRedirectUri("")).toBe(false);
    expect(await isSafeRedirectUri(undefined as unknown as string)).toBe(false);
  });

  test("should allow relative paths", async () => {
    expect(await isSafeRedirectUri("/dashboard")).toBe(true);
    expect(await isSafeRedirectUri("/ui/console")).toBe(true);
    expect(await isSafeRedirectUri("/")).toBe(true);
  });

  test("should reject protocol-relative paths", async () => {
    expect(await isSafeRedirectUri("//evil.com")).toBe(false);
    expect(await isSafeRedirectUri("\\\\evil.com")).toBe(false);
  });

  test("should allow absolute URLs matching the current host", async () => {
    expect(await isSafeRedirectUri("https://my-zitadel.com/console")).toBe(true);
  });

  test("should allow absolute URLs to external domains", async () => {
    expect(await isSafeRedirectUri("https://evil.com")).toBe(true);
    expect(await isSafeRedirectUri("https://settings.com/dashboard")).toBe(true);
  });

  test("should allow custom mobile deep link protocols", async () => {
    expect(await isSafeRedirectUri("io.swiftconnect.mobile.dev.zitadel:/oauth/callback")).toBe(true);
    expect(await isSafeRedirectUri("ch.zitadel.app://callback")).toBe(true);
  });

  test("should reject executable and browser-local protocols", async () => {
    expect(await isSafeRedirectUri("javascript:alert(1)")).toBe(false);
    expect(await isSafeRedirectUri("data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==")).toBe(false);
    expect(await isSafeRedirectUri("vbscript:msgbox(1)")).toBe(false);
    expect(await isSafeRedirectUri("file:///etc/passwd")).toBe(false);
  });

  test("should gracefully reject invalid, unparsable URLs that aren't relative", async () => {
    expect(await isSafeRedirectUri("not-a-valid-url")).toBe(false);
    expect(await isSafeRedirectUri("http://%")).toBe(false);
  });
});

describe("isExternalUrl", () => {
  test("should return false for relative paths", () => {
    expect(isExternalUrl("/dashboard")).toBe(false);
    expect(isExternalUrl("/ui/console")).toBe(false);
    expect(isExternalUrl("/")).toBe(false);
    expect(isExternalUrl("/password?loginName=user@example.com")).toBe(false);
    expect(isExternalUrl("/signedin?sessionId=123&organization=456")).toBe(false);
  });

  test("should return true for absolute HTTPS URLs", () => {
    expect(isExternalUrl("https://example.com/callback")).toBe(true);
    expect(isExternalUrl("https://my-zitadel.com/ui/console")).toBe(true);
  });

  test("should return true for absolute HTTP URLs", () => {
    expect(isExternalUrl("http://localhost:3000/callback")).toBe(true);
    expect(isExternalUrl("http://example.com")).toBe(true);
  });

  test("should return true for custom protocol schemes (native apps)", () => {
    expect(isExternalUrl("myapp://callback")).toBe(true);
    expect(isExternalUrl("com.example.app://oauth/callback")).toBe(true);
    expect(isExternalUrl("io.zitadel.app://auth")).toBe(true);
    expect(isExternalUrl("flutter-app://callback?code=abc&state=xyz")).toBe(true);
  });

  test("should return true for protocol-relative URLs", () => {
    expect(isExternalUrl("//evil.com")).toBe(true);
    expect(isExternalUrl("//example.com/path")).toBe(true);
  });
});

describe("handleServerActionResponse", () => {
  afterEach(() => vi.unstubAllGlobals());

  test.each([
    "io.swiftconnect.mobile.dev.zitadel:/oauth/callback?code=abc&state=xyz",
    "ch.zitadel.app://callback",
    "https://idp.example.com/authorize",
  ])("navigates directly to an external callback: %s", (redirect) => {
    const location = { href: "https://login.example.com/ui/v2/login/loginname" };
    vi.stubGlobal("window", { location });
    const router = { push: vi.fn() };
    const setError = vi.fn();

    expect(handleServerActionResponse({ redirect }, router, vi.fn(), setError)).toBe(true);

    expect(location.href).toBe(redirect);
    expect(router.push).not.toHaveBeenCalled();
    expect(setError).not.toHaveBeenCalled();
  });

  test("uses the router for an internal login step", () => {
    const router = { push: vi.fn() };
    expect(handleServerActionResponse({ redirect: "/password?loginName=user" }, router, vi.fn(), vi.fn())).toBe(true);
    expect(router.push).toHaveBeenCalledWith("/password?loginName=user");
  });
});
