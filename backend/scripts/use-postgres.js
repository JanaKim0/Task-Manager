'use strict';

/**
 * Switches the Prisma datasource from SQLite to PostgreSQL.
 *
 * Run on the hosting platform during the build, never locally: the file it
 * edits is `prisma/schema.prisma`, and the repository keeps SQLite because
 * that is what the desktop app and local development use.
 *
 * Prisma refuses `provider = env("...")` — the provider has to be a literal
 * — so a build step rewriting one line is the simplest way to ship the same
 * schema to two different databases.
 *
 * Run: node scripts/use-postgres.js
 */

const fs = require('node:fs');
const path = require('node:path');

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
const schema = fs.readFileSync(schemaPath, 'utf8');

if (schema.includes('provider = "postgresql"')) {
  console.log('Schema already targets PostgreSQL, nothing to do.');
  process.exit(0);
}

if (!schema.includes('provider = "sqlite"')) {
  console.error('Could not find the sqlite provider line in schema.prisma.');
  process.exit(1);
}

fs.writeFileSync(
  schemaPath,
  schema.replace('provider = "sqlite"', 'provider = "postgresql"'),
);

console.log('schema.prisma now targets PostgreSQL.');
