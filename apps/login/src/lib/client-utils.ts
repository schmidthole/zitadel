export type ServerActionResponse =
  | { redirect: string }
  | { error: string }
  | { samlData: { url: string; fields: Record<string, string> } }
  | undefined
  | null;

export function handleServerActionResponse(
  response: ServerActionResponse,
  router: { push: (url: string) => void },
  setSamlData: (data: { url: string; fields: Record<string, string> }) => void,
  setError: (error: string) => void,
): boolean {
  if (!response) {
    return false;
  }

  if ("redirect" in response && response.redirect) {
    if (isSafeRedirectUri(response.redirect)) {
      if (isClientSideProtocolRedirect(response.redirect)) {
        window.location.assign(response.redirect);
      } else {
        router.push(response.redirect);
      }
      return true;
    } else {
      console.warn("handleServerActionResponse: Blocked unsafe redirect URI:", response.redirect);
      setError("Unsafe redirect URI was blocked");
      return true;
    }
  }

  if ("samlData" in response && response.samlData) {
    setSamlData(response.samlData);
    return true;
  }

  if ("error" in response && response.error) {
    setError(response.error);
    return true;
  }

  return false;
}

/**
 * Validates whether a given redirect URI is safe.
 * Safe URIs are relative paths or absolute URLs that are not executable/browser-local schemes.
 * This prevents open redirect vulnerabilities and XSS via javascript:/data: URIs.
 */
export function isSafeRedirectUri(uri: string): boolean {
  if (!uri) return false;

  // 1. Relative paths are generally safe
  if (uri.startsWith("/") && !uri.startsWith("//")) {
    return true;
  }

  // 2. Check absolute URLs for unsafe executable or browser-local protocols.
  // Custom mobile deep link schemes are allowed for native app callbacks.
  try {
    const parsedUri = new URL(uri);
    const unsafeProtocols = new Set(["javascript:", "data:", "vbscript:", "file:"]);

    if (unsafeProtocols.has(parsedUri.protocol.toLowerCase())) {
      return false;
    }

    return true;
  } catch {
    // If it can't be parsed as a URL and didn't start with /, it's unsafe
    return false;
  }
}

function isClientSideProtocolRedirect(uri: string): boolean {
  try {
    const parsedUri = new URL(uri);
    return parsedUri.protocol !== "http:" && parsedUri.protocol !== "https:";
  } catch {
    return false;
  }
}
