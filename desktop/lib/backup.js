'use strict';

const fs = require('node:fs');
const path = require('node:path');

/** How many old copies to keep before the oldest is thrown away. */
const KEEP = 15;

/**
 * Copies the database aside every time the app starts.
 *
 * This is the safety net: a failed migration, a mistake while editing the
 * project, or a corrupted file all become recoverable by copying one of
 * these back over task-manager.db. It runs before migrations on purpose.
 */
function backupDatabase(databasePath, backupsDir) {
  if (!fs.existsSync(databasePath)) {
    // Nothing to protect yet — this is the very first launch.
    return null;
  }

  const stamp = new Date()
    .toISOString()
    .slice(0, 19)
    .replace('T', '_')
    .replace(/:/g, '-');

  const target = path.join(backupsDir, `task-manager_${stamp}.db`);

  try {
    fs.copyFileSync(databasePath, target);
    pruneOldBackups(backupsDir);
    return target;
  } catch (error) {
    // A failed backup must not stop the app from opening — the user would
    // lose access to their tasks over a precaution.
    console.error('Could not write a backup:', error);
    return null;
  }
}

function pruneOldBackups(backupsDir) {
  const files = fs
    .readdirSync(backupsDir)
    .filter((name) => name.startsWith('task-manager_') && name.endsWith('.db'))
    .sort()
    .reverse();

  for (const name of files.slice(KEEP)) {
    try {
      fs.unlinkSync(path.join(backupsDir, name));
    } catch {
      // Locked or already gone; it will be picked up next time.
    }
  }
}

module.exports = { backupDatabase };
