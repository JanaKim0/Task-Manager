'use strict';

/**
 * Starts the staged backend the way the installed app starts it, and asks it
 * a question that only a working query engine can answer.
 *
 * The point is the pruning in stage.js: that script deletes packages npm
 * installed but the app never loads. "Never loads" is a claim, and this is
 * what checks it — a missing package shows up here as a failed build rather
 * than as an app that will not open on someone's desktop.
 *
 * Run automatically at the end of stage.js. Standalone: node scripts/smoke.js
 */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { applyMigrations } = require('../lib/migrate');

const DESKTOP = path.join(__dirname, '..');
const STAGED = path.join(DESKTOP, 'app-content', 'backend');

async function main() {
  if (!fs.existsSync(path.join(STAGED, 'dist', 'server.js'))) {
    throw new Error(`Nothing staged yet: ${STAGED}`);
  }

  // A throwaway database in a temp folder. The real one is never opened.
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'task-manager-smoke-'));
  const database = path.join(scratch, 'smoke.db');
  process.env.DATABASE_URL = `file:${database.replace(/\\/g, '/')}`;

  const { PrismaClient } = require(
    path.join(STAGED, 'node_modules', '@prisma', 'client'),
  );

  let server = null;
  const prisma = new PrismaClient();

  try {
    await applyMigrations(prisma, path.join(STAGED, 'prisma', 'migrations'));
    await prisma.$disconnect();

    const { startServer } = require(path.join(STAGED, 'dist', 'server.js'));
    server = await startServer({
      port: 0,
      staticDir: path.join(DESKTOP, 'app-content', 'frontend'),
    });

    // Reaches the controller, the service, Prisma and the query engine.
    const response = await fetch(`${server.url}/api/workspaces`);
    if (!response.ok) {
      throw new Error(`GET /api/workspaces returned ${response.status}`);
    }
    const body = await response.json();
    if (!Array.isArray(body)) {
      throw new Error(`GET /api/workspaces returned ${typeof body}, not a list`);
    }

    // And that the UI is actually being served, not just the API.
    const page = await fetch(server.url);
    if (!page.ok) {
      throw new Error(`GET / returned ${page.status}`);
    }

    console.log('[smoke] the staged app starts, serves the UI and reads the database');
  } finally {
    if (server) {
      await server.close().catch(() => undefined);
    }
    await prisma.$disconnect().catch(() => undefined);
    fs.rmSync(scratch, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error('[smoke] FAILED —', error?.message ?? error);
  console.error(
    '[smoke] The staged app is broken. Most likely something in ' +
      'DROP_PACKAGES (scripts/stage.js) is needed after all.',
  );
  process.exit(1);
});
