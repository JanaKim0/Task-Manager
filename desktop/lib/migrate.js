'use strict';

const fs = require('node:fs');
const path = require('node:path');

/**
 * Brings the database up to date with the schema.
 *
 * The Prisma CLI is a development tool and is not shipped with the app, so
 * this applies the same `migration.sql` files itself and records what it has
 * already run in its own table. Migrations are never re-run, and the ones
 * from a future version simply appear the next time the app is updated.
 */
async function applyMigrations(prisma, migrationsDir) {
  if (!fs.existsSync(migrationsDir)) {
    throw new Error(`Migrations folder not found: ${migrationsDir}`);
  }

  await prisma.$executeRawUnsafe(
    `CREATE TABLE IF NOT EXISTS _app_migrations (
       name TEXT PRIMARY KEY NOT NULL,
       applied_at TEXT NOT NULL
     )`,
  );

  const rows = await prisma.$queryRawUnsafe(
    'SELECT name FROM _app_migrations',
  );
  const applied = new Set(rows.map((row) => row.name));

  const folders = fs
    .readdirSync(migrationsDir)
    .filter((name) =>
      fs.statSync(path.join(migrationsDir, name)).isDirectory(),
    )
    // Prisma prefixes folders with a timestamp, so alphabetical order is
    // also chronological order.
    .sort();

  const freshlyApplied = [];

  for (const folder of folders) {
    if (applied.has(folder)) {
      continue;
    }

    const sqlFile = path.join(migrationsDir, folder, 'migration.sql');
    if (!fs.existsSync(sqlFile)) {
      continue;
    }

    for (const statement of splitStatements(fs.readFileSync(sqlFile, 'utf8'))) {
      await prisma.$executeRawUnsafe(statement);
    }

    await prisma.$executeRawUnsafe(
      'INSERT INTO _app_migrations (name, applied_at) VALUES (?, ?)',
      folder,
      new Date().toISOString(),
    );

    freshlyApplied.push(folder);
  }

  return freshlyApplied;
}

/**
 * Splits a .sql file into single statements.
 *
 * Semicolons inside quoted text are ignored, so a default value containing
 * one does not cut a statement in half.
 */
function splitStatements(sql) {
  const statements = [];
  let current = '';
  let inString = false;

  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];

    if (char === "'") {
      // Two quotes in a row are an escaped quote, not the end of the string.
      if (inString && sql[i + 1] === "'") {
        current += "''";
        i++;
        continue;
      }
      inString = !inString;
    }

    if (char === ';' && !inString) {
      statements.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  statements.push(current);

  return statements
    .map((statement) => stripComments(statement).trim())
    .filter((statement) => statement.length > 0);
}

function stripComments(statement) {
  return statement
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n');
}

module.exports = { applyMigrations, splitStatements };
