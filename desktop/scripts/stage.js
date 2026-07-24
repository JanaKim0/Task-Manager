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
const { execFileSync } = require('node:child_process');

const DESKTOP = path.join(__dirname, '..');
const ROOT = path.join(DESKTOP, '..');
const BACKEND = path.join(ROOT, 'backend');
const FRONTEND_BUILD = path.join(ROOT, 'frontend', 'dist', 'frontend', 'browser');

const OUT = path.join(DESKTOP, 'app-content');
const OUT_BACKEND = path.join(OUT, 'backend');

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
  // npm.cmd on Windows, npm elsewhere — calling the executable directly
  // avoids running the command through a shell.
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  execFileSync(npm, ['ci', '--omit=dev', '--ignore-scripts'], {
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
  );

  log('copying the built UI');
  copyDir(FRONTEND_BUILD, path.join(OUT, 'frontend'));

  log(`done: ${OUT}`);
}

main();
