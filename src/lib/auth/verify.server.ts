import { getRequest } from "@tanstack/react-start/server";
import { auth, authConfigured, authEnabled } from "./server";

/**
 * Server-side session resolution.
 *
 * The session belongs to THIS application and is read from the Better Auth
 * session cookie on the incoming request.
 */

/** True when a real database is configured server-side. */
const databaseConfigured = Boolean(process.env.DATABASE_URL?.trim());

export { authConfigured };

if (databaseConfigured && !authEnabled) {
  console.error(
    "[auth] DATABASE_URL is set but auth is disabled " +
      "(VITE_AUTH_ENABLED=false) — requireUserId() will reject every request " +
      "instead of sharing one dev user against a real database.",
  );
}

/** Dev fallback user id, used only when authentication is disabled. */
export const DEV_USER_ID = "dev-user";

/**
 * Thrown when the caller has no valid authenticated session.
 */
export class UnauthorizedError extends Error {
  readonly status = 401;

  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}

export type VerifiedUser = {
  id: string;
  email: string | null;
};

/**
 * Resolve the signed-in user from the current request.
 */
export async function getSessionUser(): Promise<VerifiedUser | null> {
  if (!authEnabled) return null;

  const request = getRequest();

  if (!request) return null;

  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user) return null;

  return {
    id: session.user.id,
    email: session.user.email ?? null,
  };
}

/**
 * Resolve the current user id for a protected server function.
 */
export async function requireUserId(): Promise<string> {
  if (!authEnabled) {
    if (databaseConfigured) {
      throw new Error(
        "Auth is disabled (VITE_AUTH_ENABLED=false) but DATABASE_URL is set — " +
          "refusing to fall back to the shared dev user against a real database.",
      );
    }

    return DEV_USER_ID;
  }

  if (!authConfigured) {
    throw new Error(
      "Authentication is enabled but Google OAuth is not configured.",
    );
  }

  const user = await getSessionUser();

  if (!user) {
    throw new UnauthorizedError();
  }

  return user.id;
}
