import { create } from "@zitadel/client";
import { LoginSettingsSchema } from "@zitadel/proto/zitadel/settings/v2/login_settings_pb";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import {
  buildLoginErrorRedirect,
  getLoginTitleOverride,
  isRegistrationAllowed,
  isRegistrationDisabled,
} from "./login-config";

describe("login config", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.ZITADEL_LOGIN_DISABLE_REGISTRATION;
    delete process.env.ZITADEL_LOGIN_TITLE;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  test("preserves registration when disable flag is unset", () => {
    expect(isRegistrationDisabled()).toBe(false);
  });

  test("only disables registration when flag is exactly true", () => {
    process.env.ZITADEL_LOGIN_DISABLE_REGISTRATION = "false";
    expect(isRegistrationDisabled()).toBe(false);

    process.env.ZITADEL_LOGIN_DISABLE_REGISTRATION = "true";
    expect(isRegistrationDisabled()).toBe(true);
  });

  test("combines backend registration setting with app disable flag", () => {
    const loginSettings = create(LoginSettingsSchema, { allowRegister: true });

    expect(isRegistrationAllowed(loginSettings)).toBe(true);

    process.env.ZITADEL_LOGIN_DISABLE_REGISTRATION = "true";
    expect(isRegistrationAllowed(loginSettings)).toBe(false);
  });

  test("returns trimmed custom login title only when set", () => {
    expect(getLoginTitleOverride()).toBeUndefined();

    process.env.ZITADEL_LOGIN_TITLE = "   ";
    expect(getLoginTitleOverride()).toBeUndefined();

    process.env.ZITADEL_LOGIN_TITLE = "  Sign in to Acme  ";
    expect(getLoginTitleOverride()).toBe("Sign in to Acme");
  });

  test("builds neutral login error redirects with known context", () => {
    expect(
      buildLoginErrorRedirect({
        organization: "org123",
        requestId: "req123",
        postErrorRedirectUrl: "/loginname",
      }),
    ).toBe("/login-error?organization=org123&requestId=req123&postErrorRedirectUrl=%2Floginname");
  });
});
