#!/usr/bin/env node

import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";
import { pendingMigrations } from "./migration-plan.mjs";

const databaseUrl = process.env.DATABASE_URL?.trim();

if (!databaseUrl) {
  console.log(
    "[migrate] DATABASE_URL not set — skipping database migration.",
  );
  process.exit(0);
}

const migrationsDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "migrations",
);

function getDatabaseCaCert() {
  const value = process.env.DATABASE_CA_CERT?.trim();

  if (!value) {
    console.warn("[migrate] DATABASE_CA_CERT is not set.");
    return undefined;
  }

  const ca = value.replace(/\\n/g, "\n");

  if (
    !ca.includes("-----BEGIN CERTIFICATE-----") ||
    !ca.includes("-----END CERTIFICATE-----")
  ) {
    throw new Error(
      "[migrate] DATABASE_CA_CERT is not a valid PEM certificate.",
    );
  }

  console.log("[migrate] DATABASE_CA_CERT loaded successfully.");

  return ca;
}

async function main() {
  let entries;

  try {
    entries = await readdir(migrationsDir);
  } catch {
    console.log("[migrate] no migrations/ directory — nothing to do.");
    return;
  }

  const migrations = pendingMigrations(entries, []);

  if (migrations.length === 0) {
    console.log("[migrate] no migrations — nothing to do.");
    return;
  }

  const databaseCaCert = getDatabaseCaCert();

  const pool = new pg.Pool({
    connectionString: databaseUrl,
    max: 1,
    ssl: databaseCaCert
      ? {
          ca: databaseCaCert,
          rejectUnauthorized: true,
        }
      : undefined,
  });

  let client;

  try {
    client = await pool.connect();

    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        name TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    const appliedResult = await client.query(
      "SELECT name FROM _migrations",
    );

    const applied = appliedResult.rows.map((row) => row.name);

    const pending = pendingMigrations(entries, applied);

    let count = 0;

    for (const { name } of pending) {
      const text = await readFile(
        join(migrationsDir, name),
        "utf8",
      );

      try {
        await client.query("BEGIN");

        await client.query(text);

        await client.query(
          "INSERT INTO _migrations (name) VALUES ($1)",
          [name],
        );

        await client.query("COMMIT");

        console.log(`[migrate] applied ${name}`);

        count += 1;
      } catch (error) {
        console.error(`[migrate] error applying ${name}`);

        try {
          await client.query("ROLLBACK");
        } catch {
          // Ignore rollback failure.
        }

        throw error;
      }
    }

    console.log(
      count
        ? `[migrate] done — ${count} migration(s) applied.`
        : "[migrate] up to date.",
    );
  } finally {
    client?.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(
    "[migrate] failed:",
    error?.message || error,
  );

  for (const key of [
    "code",
    "detail",
    "hint",
    "position",
    "where",
  ]) {
    if (error?.[key] != null) {
      console.error(
        `[migrate] ${key}: ${error[key]}`,
      );
    }
  }

  process.exit(1);
});
