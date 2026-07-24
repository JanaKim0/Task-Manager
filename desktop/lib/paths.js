'use strict';

const { app } = require('electron');
const path = require('node:path');
const fs = require('node:fs');

/**
 * Where everything lives, in development and inside the installed app.
 *
 * The important one is `database`. It sits in the user's app-data folder,
 * NOT next to the program files: an update replaces the program, and
 * anything stored beside it would be replaced with it.
 */
function resolvePaths() {
  const packaged = app.isPackaged;

  // Development runs from the repository; the packaged app reads the copies
  // electron-builder placed in its resources folder.
  const root = packaged
    ? path.join(process.resourcesPath, 'app-content')
    : path.join(__dirname, '..', '..');

  const dataDir = app.getPath('userData');
  const backupsDir = path.join(dataDir, 'backups');

  fs.mkdirSync(dataDir, { recursive: true });
  fs.mkdirSync(backupsDir, { recursive: true });

  return {
    packaged,
    dataDir,
    backupsDir,
    database: path.join(dataDir, 'task-manager.db'),
    windowState: path.join(dataDir, 'window-state.json'),
    serverEntry: path.join(root, 'backend', 'dist', 'server.js'),
    migrations: path.join(root, 'backend', 'prisma', 'migrations'),
    prismaClient: path.join(root, 'backend', 'node_modules', '@prisma', 'client'),
    frontend: packaged
      ? path.join(root, 'frontend')
      : path.join(root, 'frontend', 'dist', 'frontend', 'browser'),
  };
}

/**
 * Prisma wants a URL, not a Windows path: backslashes have to become
 * forward slashes or the connection string is misread.
 */
function toDatabaseUrl(filePath) {
  return `file:${filePath.replace(/\\/g, '/')}`;
}

module.exports = { resolvePaths, toDatabaseUrl };
