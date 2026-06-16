import "server-only";

import { LoginSettings } from "@zitadel/proto/zitadel/settings/v2/login_settings_pb";

export function isRegistrationDisabled(): boolean {
  return process.env.ZITADEL_LOGIN_DISABLE_REGISTRATION === "true";
}

export function isRegistrationAllowed(loginSettings: LoginSettings | undefined): boolean {
  return !!loginSettings?.allowRegister && !isRegistrationDisabled();
}

export function getLoginTitleOverride(): string | undefined {
  const title = process.env.ZITADEL_LOGIN_TITLE?.trim();
  return title || undefined;
}

export function buildLoginErrorRedirect({
  organization,
  requestId,
  postErrorRedirectUrl,
}: {
  organization?: string;
  requestId?: string;
  postErrorRedirectUrl?: string;
} = {}): string {
  const params = new URLSearchParams();

  if (organization) {
    params.set("organization", organization);
  }
  if (requestId) {
    params.set("requestId", requestId);
  }
  if (postErrorRedirectUrl) {
    params.set("postErrorRedirectUrl", postErrorRedirectUrl);
  }

  const query = params.toString();
  return query ? `/login-error?${query}` : "/login-error";
}
