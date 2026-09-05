import { createAuthClient } from "better-auth/react";

/**
 * Better Auth client for Tally.
 *
 * Authentication is handled directly by Google through Better Auth.
 *
 * Browser flow:
 *
 * Tally
 *   ↓
 * Better Auth
 *   ↓
 * Google OAuth
 *   ↓
 * /api/auth/callback/google
 */
export const authClient = createAuthClient();

/**
 * True when authentication is enabled.
 */
export const authEnabled =
  import.meta.env.VITE_AUTH_ENABLED !== "false";

/**
 * Start Google sign-in.
 */
export async function signIn(
  opts: {
    callbackURL?: string;
    errorCallbackURL?: string;
  } = {},
): Promise<void> {
  const callbackURL = opts.callbackURL ?? "/";
  const errorCallbackURL = opts.errorCallbackURL ?? "/login";

  const { data, error } = await authClient.signIn.social({
    provider: "google",
    callbackURL,
    errorCallbackURL,
  });

  if (error) {
    throw new Error(error.message ?? "Google sign-in failed");
  }

  if (data?.url) {
    window.location.href = data.url;
  }
}

/**
 * Sign out of Tally's Better Auth session.
 */
export async function signOut(redirectTo = "/"): Promise<void> {
  const { error } = await authClient.signOut();

  if (error) {
    throw new Error(error.message ?? "Sign-out failed");
  }

  window.location.href = redirectTo;
}
