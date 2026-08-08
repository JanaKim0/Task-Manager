'use strict';

/**
 * Collects everything the installed app needs into desktop/app-content.
 *
 * electron-builder copies that one folder into the app's resources, and
 * lib/paths.js looks for it there. Keeping the copying here rather than in
 * the builder config makes it possible to inspect the result before packing.
 *
 * Run: node scripts/stage.js
 */

const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

const DESKTOP = path.join(__dirname, '..');
const ROOT = path.join(DESKTOP, '..');
const BACKEND = path.join(ROOT, 'backend');
const FRONTEND_BUILD = path.join(ROOT, 'frontend', 'dist', 'frontend', 'browser');

const OUT = path.join(DESKTOP, 'app-content');
const OUT_BACKEND = path.join(OUT, 'backend');

/**
 * Packages npm installs but the running app never loads.
 *
 * `@prisma/client` declares `prisma` and `typescript` as optional peer
 * dependencies, and npm installs optional peers by default — so the Prisma
 * CLI and the TypeScript compiler end up in a production install, dragging
 * their own dependencies along with them. None of it is reachable at
 * runtime: the generated client requires exactly one thing,
 * `@prisma/client/runtime/library.js`, plus `fs` and `path`.
 *
 * Everything here is checked by the smoke test at the end of this script,
 * which starts the real server against a real database. If a future version
 * of Prisma starts needing one of these, the build fails instead of
 * producing an app that cannot open.
 */
const DROP_PACKAGES = [
  // The Prisma CLI: migrations are applied by desktop/lib/migrate.js instead.
  'prisma',
  // Peer of @prisma/client, used only to type-check code that imports it.
  'typescript',
  // Pulled in by the Prisma CLI, nothing else.
  'effect',
  '@effect',
  'jiti',
  'fast-check',
  'pure-rand',
  // CLI-side Prisma helpers: engine downloading, platform detection, config.
  '@prisma/config',
  '@prisma/debug',
  '@prisma/engines',
  '@prisma/engines-version',
  '@prisma/fetch-engine',
  '@prisma/get-platform',
];

/** Query engines for databases this app does not use. ~23 MB of base64. */
const FOREIGN_ENGINE_PREFIXES = [
  'query_engine_bg.cockroachdb',
  'query_engine_bg.mysql',
  'query_engine_bg.postgresql',
  'query_engine_bg.sqlserver',
];

function log(message) {
  console.log(`[stage] ${message}`);
}

function requireExists(target, hint) {
  if (!fs.existsSync(target)) {
    throw new Error(`Missing: ${target}\n${hint}`);
  }
}

function copyDir(from, to, skip = () => false) {
  fs.mkdirSync(to, { recursive: true });

  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const source = path.join(from, entry.name);
    const target = path.join(to, entry.name);

    if (skip(entry.name, source)) {
      continue;
    }

    if (entry.isDirectory()) {
      copyDir(source, target, skip);
    } else {
      fs.copyFileSync(source, target);
    }
  }
}

function countFiles(dir) {
  let files = 0;
  let bytes = 0;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const inner = countFiles(target);
      files += inner.files;
      bytes += inner.bytes;
    } else {
      files += 1;
      bytes += fs.statSync(target).size;
    }
  }

  return { files, bytes };
}

function describe(dir) {
  const { files, bytes } = countFiles(dir);
  return `${files} files, ${Math.round(bytes / 1024 / 1024)} MB`;
}

function remove(target) {
  fs.rmSync(target, { recursive: true, force: true });
}

/**
 * Throws away everything the installed app carries but never opens.
 *
 * This is not housekeeping. Windows Defender scans every file an
 * application touches on a cold start, and the difference between eleven
 * thousand files and one thousand is the difference between a shortcut that
 * seems broken and one that opens.
 */
function prune() {
  const modules = path.join(OUT_BACKEND, 'node_modules');

  for (const name of DROP_PACKAGES) {
    remove(path.join(modules, name));
  }

  // Copies of the query engine left behind by interrupted `prisma generate`
  // runs. They are 20 MB each and there can be several.
  const generated = path.join(modules, '.prisma', 'client');
  for (const name of fs.readdirSync(generated)) {
    if (/\.tmp\d+$/.test(name)) {
      remove(path.join(generated, name));
    }
  }

  const runtime = path.join(modules, '@prisma', 'client', 'runtime');
  if (fs.existsSync(runtime)) {
    for (const name of fs.readdirSync(runtime)) {
      if (FOREIGN_ENGINE_PREFIXES.some((prefix) => name.startsWith(prefix))) {
        remove(path.join(runtime, name));
      }
    }
  }

  // Type declarations and source maps are for editors and debuggers; neither
  // is present when the packaged app runs.
  dropByExtension(modules, ['.d.ts', '.d.mts', '.d.cts', '.map']);
}

function dropByExtension(dir, extensions) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const target = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      dropByExtension(target, extensions);
    } else if (extensions.some((extension) => entry.name.endsWith(extension))) {
      fs.rmSync(target, { force: true });
    }
  }
}

/**
 * Starts the staged server for real, against a throwaway database, and asks
 * it for the workspace list.
 *
 * A shorter check — "does the file exist" — would pass on a build that
 * cannot load the query engine. This one fails on it.
 */
function smokeTest() {
  execSync(`node "${path.join(__dirname, 'smoke.js')}"`, {
    cwd: DESKTOP,
    stdio: 'inherit',
  });
}

function main() {
  requireExists(
    path.join(BACKEND, 'dist', 'server.js'),
    'Build the backend first: npm run build --prefix ../backend',
  );
  requireExists(
    path.join(FRONTEND_BUILD, 'index.html'),
    'Build the UI first: npm run build:desktop --prefix ../frontend',
  );

  log('clearing app-content');
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });

  log('copying backend build');
  copyDir(path.join(BACKEND, 'dist'), path.join(OUT_BACKEND, 'dist'), (name) =>
    name.endsWith('.map') || name.endsWith('.tsbuildinfo'),
  );

  log('copying prisma schema and migrations');
  // The local dev database must never be shipped: it holds test data, and
  // the installed app has its own file in the user's app-data folder.
  copyDir(path.join(BACKEND, 'prisma'), path.join(OUT_BACKEND, 'prisma'), (name) =>
    name.endsWith('.db') || name.endsWith('.db-journal') || name === 'seed.ts',
  );

  log('copying package manifests');
  for (const file of ['package.json', 'package-lock.json']) {
    fs.copyFileSync(path.join(BACKEND, file), path.join(OUT_BACKEND, file));
  }

  log('installing production dependencies (this takes a minute)');
  // A fixed command string through execSync. Node 24 refuses to spawn
  // npm.cmd directly on Windows, and passing an argument array with
  // shell: true is deprecated — a literal command avoids both. Nothing
  // here comes from user input, so there is nothing to escape.
  execSync('npm ci --omit=dev --ignore-scripts', {
    cwd: OUT_BACKEND,
    stdio: 'inherit',
  });

  // --ignore-scripts above skips Prisma's postinstall, which would need the
  // Prisma CLI. The client and its query engine were already generated
  // during development, so they are copied across as they are.
  log('copying the generated Prisma client');
  requireExists(
    path.join(BACKEND, 'node_modules', '.prisma', 'client'),
    'Generate it first: npx prisma generate (in backend/)',
  );
  copyDir(
    path.join(BACKEND, 'node_modules', '.prisma'),
    path.join(OUT_BACKEND, 'node_modules', '.prisma'),
    // Leftovers from interrupted `prisma generate` runs: 20 MB each.
    (name) => /\.tmp\d+$/.test(name),
  );

  log('copying the built UI');
  copyDir(FRONTEND_BUILD, path.join(OUT, 'frontend'));

  log(`before pruning: ${describe(OUT)}`);
  log('dropping build-time packages');
  prune();
  log(`after pruning:  ${describe(OUT)}`);

  log('smoke test: starting the staged server');
  smokeTest();

  log(`done: ${OUT}`);
}

main();
