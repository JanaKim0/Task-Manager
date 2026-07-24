'use strict';

const fs = require('node:fs');
const { screen } = require('electron');

const DEFAULTS = { width: 1280, height: 820, maximized: false };

/** Remembers window size and position between launches. */
function loadWindowState(statePath) {
  let state = { ...DEFAULTS };

  try {
    if (fs.existsSync(statePath)) {
      state = { ...state, ...JSON.parse(fs.readFileSync(statePath, 'utf8')) };
    }
  } catch {
    // A damaged file is not worth an error message; the defaults are fine.
  }

  return isOnScreen(state) ? state : { ...DEFAULTS };
}

function saveWindowState(statePath, window) {
  if (!window || window.isDestroyed()) {
    return;
  }

  // getBounds() during maximise returns the full screen, which would make
  // the window impossible to restore to its old size.
  const bounds = window.isMaximized()
    ? window.getNormalBounds()
    : window.getBounds();

  const state = { ...bounds, maximized: window.isMaximized() };

  try {
    fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
  } catch {
    // Not important enough to interrupt closing the app.
  }
}

/**
 * A window remembered on a second monitor must not open off-screen after
 * that monitor is unplugged.
 */
function isOnScreen(state) {
  if (state.x === undefined || state.y === undefined) {
    return true;
  }

  return screen.getAllDisplays().some(({ workArea }) => {
    return (
      state.x >= workArea.x - 50 &&
      state.y >= workArea.y - 50 &&
      state.x + 100 <= workArea.x + workArea.width &&
      state.y + 100 <= workArea.y + workArea.height
    );
  });
}

module.exports = { loadWindowState, saveWindowState };
