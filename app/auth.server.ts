// app/auth.server.ts
import { redirect, json } from "@remix-run/node";

const AUTH_CHECK_URL = "https://api-chat.kwikon.club/auth/check";
const AUTH_REFRESH_URL = "https://api-chat.kwikon.club/auth/refresh";
const AUTH_LOGOUT_URL = "https://api-chat.kwikon.club/auth/logout";

interface AuthCheckResponse {
  status: "authenticated" | "refresh_required" | "login_required";
  reason: string;
  user?: any; // Define more strictly if user object structure is known
}

/**
 * Checks the current authentication status.
 */
async function checkAuthStatusInternal(request: Request): Promise<AuthCheckResponse & { apiError?: string }> {
  try {
    const response = await fetch(AUTH_CHECK_URL, {
      headers: { Cookie: request.headers.get("Cookie") || "" },
      cache: "no-store", // Ensure fresh check
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => `Auth check API request failed with status ${response.status}`);
      console.error("Auth check API error:", response.status, errorText);
      return { status: "login_required", reason: "auth_service_error", apiError: `Auth service error: ${response.statusText || response.status}` };
    }
    const data: AuthCheckResponse = await response.json();
    return data;
  } catch (e: any) {
    console.error("Error during auth check API call:", e.message);
    return { status: "login_required", reason: "network_error", apiError: "Could not connect to auth service." };
  }
}

/**
 * Attempts to refresh the authentication tokens.
 * Returns an object with success status and any Set-Cookie headers to be applied.
 */
async function refreshAuthTokenInternal(request: Request): Promise<{ success: boolean; headers?: Headers; apiError?: string }> {
  try {
    const response = await fetch(AUTH_REFRESH_URL, {
      method: "POST",
      headers: { Cookie: request.headers.get("Cookie") || "" },
      cache: "no-store",
    });

    const newResponseHeaders = new Headers();
    // Use getSetCookie to correctly handle multiple Set-Cookie headers
    // getSetCookie() takes no arguments
    const setCookieValues = response.headers.getSetCookie?.();

    if (setCookieValues && Array.isArray(setCookieValues)) {
        setCookieValues.forEach((cookie: string) => newResponseHeaders.append("Set-Cookie", cookie));
    } else {
        // Fallback if getSetCookie isn't available or doesn't return array
        // This part is less robust for multiple cookies but is a fallback.
        response.headers.forEach((value, key) => {
            if (key.toLowerCase() === 'set-cookie') {
                newResponseHeaders.append('Set-Cookie', value);
            }
        });
    }


    if (!response.ok) {
      const errorText = await response.text().catch(() => `Auth refresh API request failed with status ${response.status}`);
      console.error("Auth refresh API error:", response.status, errorText);
      return { success: false, headers: newResponseHeaders, apiError: `Token refresh failed: ${response.statusText || response.status}` };
    }
    return { success: true, headers: newResponseHeaders };
  } catch (e: any) {
    console.error("Error during token refresh API call:", e.message);
    return { success: false, apiError: "Could not connect to auth refresh service." };
  }
}

/**
 * Loader utility to protect routes.
 * Redirects to loginPath if not authenticated or if refresh fails.
 * Redirects to current URL with new Set-Cookie headers on successful refresh.
 * Returns user data if authenticated.
 */
export async function requireUser(
  request: Request,
  loginPath: string = "/login"
): Promise<{ user: AuthCheckResponse["user"] }> {
  const sessionCheck = await checkAuthStatusInternal(request);

  if (sessionCheck.status === "authenticated") {
    return { user: sessionCheck.user || { id: "authenticated_user" } };
  }

  if (sessionCheck.status === "refresh_required") {
    console.log("requireUser: Auth status is refresh_required. Attempting token refresh...");
    const refreshResult = await refreshAuthTokenInternal(request);

    if (refreshResult.success) {
      console.log("requireUser: Token refresh successful. Redirecting to self to apply new cookies.");
      throw redirect(request.url, { headers: refreshResult.headers });
    } else {
      console.log("requireUser: Token refresh failed. Redirecting to login.");
      throw redirect(loginPath, { headers: refreshResult.headers });
    }
  }

  console.log(`requireUser: Status is ${sessionCheck.status} (Reason: ${sessionCheck.reason}). Redirecting to login.`);
  const headersForLoginRedirect = new Headers();
  throw redirect(loginPath, { headers: headersForLoginRedirect });
}

/**
 * Utility for the login page loader.
 * If the user is already authenticated or refresh succeeds, redirects them.
 */
export async function preventAuthenticatedUser(
  request: Request,
  redirectTo: string = "/"
): Promise<null> {
  const sessionCheck = await checkAuthStatusInternal(request);

  if (sessionCheck.status === "authenticated") {
    throw redirect(redirectTo);
  }

  if (sessionCheck.status === "refresh_required") {
    console.log("preventAuthenticatedUser: Refresh required. Attempting token refresh...");
    const refreshResult = await refreshAuthTokenInternal(request);
    if (refreshResult.success) {
      console.log("preventAuthenticatedUser: Refresh successful. Redirecting with new cookies.");
      throw redirect(redirectTo, { headers: refreshResult.headers });
    }
    console.log("preventAuthenticatedUser: Refresh failed. Staying on login page.");
  }
  return null;
}

/**
 * Handles user logout.
 */
export async function logout(request: Request): Promise<Response> {
  try {
    const response = await fetch(AUTH_LOGOUT_URL, {
      method: "POST",
      headers: { Cookie: request.headers.get("Cookie") || "" },
    });

    const newResponseHeaders = new Headers();
    // getSetCookie() takes no arguments
    const setCookieValues = response.headers.getSetCookie?.();

    if (setCookieValues && Array.isArray(setCookieValues)) {
        setCookieValues.forEach((cookie: string) => newResponseHeaders.append("Set-Cookie", cookie));
    } else {
        response.headers.forEach((value, key) => {
            if (key.toLowerCase() === 'set-cookie') {
                newResponseHeaders.append('Set-Cookie', value);
            }
        });
    }
    return redirect("/login", { headers: newResponseHeaders });

  } catch (e: any) {
    console.error("Error during logout API call:", e.message);
    return redirect("/login?logoutError=true");
  }
}