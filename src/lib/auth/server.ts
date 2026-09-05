/**
 * Self-hosted Better Auth for THIS app (server-only).
 *
 * Authentication is handled directly by Google OAuth through Better Auth.
 *
 * The app runs its own Better Auth at `/api/auth/*`, so the session cookie
 * stays on this app's own origin.
 *
 * Tri-mode:
 *   - Auth enabled: Google OAuth is required and sessions are persisted.
 *   - Auth disabled (`VITE_AUTH_ENABLED=false`): no real authentication;
 *     local development may use the dev user when no real database is configured.
 *
 * NEVER import this from client code — it pulls in `pg` + server-only
 * Better Auth internals.
 */

import { betterAuth } from "better-auth";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { getCookie } from "@tanstack/react-start/server";
import { randomBytes } from "node:crypto";
import { Pool } from "pg";
import { ensureDbReady, getPglite } from "../db";
import { emailAndPasswordEnabled } from "./email-password";
import { pgliteDialect } from "./pglite-dialect";

// Kick (and share) PGLite bootstrap as soon as the auth server module loads.
void ensureDbReady();

/**
 * Read an env var, treating empty/whitespace as unset.
 */
const env = (key: string): string | undefined => {
  const value = process.env[key]?.trim();
  return value ? value : undefined;
};

/**
 * HMR-safe fallback secret for local development when a secret has not been
 * configured yet. Production/local authenticated environments should provide
 * BETTER_AUTH_SECRET explicitly.
 */
const globalAuthRef = globalThis as typeof globalThis & {
  __tallyAuthSecret__?: string;
};

function fallbackAuthSecret(): string {
  globalAuthRef.__tallyAuthSecret__ ??= randomBytes(32).toString("hex");
  return globalAuthRef.__tallyAuthSecret__;
}

const authDisabled = env("VITE_AUTH_ENABLED") === "false";

const googleClientId = env("GOOGLE_CLIENT_ID");
const googleClientSecret = env("GOOGLE_CLIENT_SECRET");

/**
 * True when real authentication is enabled and Google OAuth credentials exist.
 */
export const authConfigured =
  !authDisabled && Boolean(googleClientId && googleClientSecret);

/**
 * True when the application expects authentication to be enabled.
 */
export const authEnabled = !authDisabled;

const explicitBaseURL = env("BETTER_AUTH_URL");

const LOCAL_DEV_ORIGINS: string[] = [
  "http://localhost:8080",
  "http://127.0.0.1:8080",
  "http://[::1]:8080",
];

const baseURL =
  explicitBaseURL ??
  "http://localhost:8080";

const trustedOrigins: string[] = [
  ...new Set([
    baseURL,
    ...LOCAL_DEV_ORIGINS,
  ]),
];

const databaseUrl = env("DATABASE_URL");

/**
 * Real Postgres when DATABASE_URL is set, otherwise the app's embedded PGLite.
 */
const database = databaseUrl
  ? new Pool({ connectionString: databaseUrl })
  : {
      dialect: pgliteDialect(() => getPglite()),
      type: "postgres" as const,
    };

/**
 * Session token cookie used by Better Auth.
 *
 * `__Host-` prevents sibling domains from setting the same cookie because
 * browsers reject Domain attributes on __Host- cookies.
 */
export const SESSION_TOKEN_COOKIE = "__Host-tally-auth.session_token";

export const auth = betterAuth({
  baseURL,

  secret: env("BETTER_AUTH_SECRET") ?? fallbackAuthSecret(),

  database,

  trustedOrigins,

  /**
   * Native Google OAuth.
   *
   * Better Auth will use:
   *
   * /api/auth/sign-in/social
   * /api/auth/callback/google
   */
  ...(googleClientId && googleClientSecret
    ? {
        socialProviders: {
          google: {
            clientId: googleClientId,
            clientSecret: googleClientSecret,
            accessType: "offline",
            prompt: "select_account",
          },
        },
      }
    : {}),

  account: {
    encryptOAuthTokens: true,
    accountLinking: {
      enabled: true,
      trustedProviders: ["google"],
      requireLocalEmailVerified: false,
    },
  },

  session: {
    cookieCache: {
      enabled: true,
      maxAge: 300,
    },
  },

  ...(emailAndPasswordEnabled
    ? {
        emailAndPassword: {
          enabled: true,
        },
      }
    : {}),

  advanced: {
    useSecureCookies: false,
    defaultCookieAttributes: {
      secure: true,
      sameSite: "lax",
      path: "/",
    },
    cookies: {
      session_token: {
        name: SESSION_TOKEN_COOKIE,
      },
      session_data: {
        name: "__Host-tally-auth.session_data",
      },
      account_data: {
        name: "__Host-tally-auth.account_data",
      },
      dont_remember: {
        name: "__Host-tally-auth.dont_remember",
      },
    },
  },

  plugins: [
    tanstackStartCookies(),
  ],
});

export function readSessionToken(): string | null {
  return getCookie(SESSION_TOKEN_COOKIE) ?? null;
}
