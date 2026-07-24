'use strict';

const { app, BrowserWindow, Menu, shell, dialog } = require('electron');
const path = require('node:path');

const { resolvePaths, toDatabaseUrl } = require('./lib/paths');
const { backupDatabase } = require('./lib/backup');
const { applyMigrations } = require('./lib/migrate');
const { loadWindowState, saveWindowState } = require('./lib/window-state');

const paths = resolvePaths();

let mainWindow = null;
let server = null;

/**
 * Prepares the database before anything touches it:
 * take a backup, then bring the schema up to date.
 */
async function prepareDatabase() {
  process.env.DATABASE_URL = toDatabaseUrl(paths.database);

  const backup = backupDatabase(paths.database, paths.backupsDir);
  if (backup) {
    console.log('Backup written:', backup);
  }

  const { PrismaClient } = require(paths.prismaClient);
  const prisma = new PrismaClient();

  try {
    const applied = await applyMigrations(prisma, paths.migrations);
    if (applied.length > 0) {
      console.log('Applied migrations:', applied.join(', '));
    }
  } finally {
    await prisma.$disconnect();
  }
}

async function startBackend() {
  const { startServer } = require(paths.serverEntry);

  // Port 0 lets the system pick a free one — a fixed port could already be
  // taken by another program, and the window would open on someone else's.
  server = await startServer({ port: 0, staticDir: paths.frontend });
  console.log('Server listening on', server.url);
}

function createWindow() {
  const state = loadWindowState(paths.windowState);

  mainWindow = new BrowserWindow({
    width: state.width,
    height: state.height,
    x: state.x,
    y: state.y,
    minWidth: 900,
    minHeight: 600,
    title: 'Task Manager',
    backgroundColor: '#fdf7f9',
    // Nothing is shown until the page is painted, which avoids the white
    // flash every Electron app has by default.
    show: false,
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (state.maximized) {
    mainWindow.maximize();
  }

  mainWindow.once('ready-to-show', () => mainWindow.show());

  const persist = () => saveWindowState(paths.windowState, mainWindow);
  mainWindow.on('resize', persist);
  mainWindow.on('move', persist);
  mainWindow.on('close', persist);
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Links to GitHub and the like belong in the real browser, not in a
  // second app window with no address bar.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.loadURL(server.url);
}

function buildMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Open data folder',
          click: () => shell.openPath(paths.dataDir),
        },
        {
          label: 'Open backups folder',
          click: () => shell.openPath(paths.backupsDir),
        },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Source code on GitHub',
          click: () =>
            shell.openExternal('https://github.com/JanaKim0/Task-Manager'),
        },
        {
          label: 'About',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Task Manager',
              message: `Task Manager ${app.getVersion()}`,
              detail:
                `Built by Jana Kim\n\n` +
                `Your tasks are stored in:\n${paths.database}\n\n` +
                `A copy is made in the backups folder every time the app starts.`,
              buttons: ['OK'],
            });
          },
        },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

/** Only one copy may run: two would write to the same database file. */
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    try {
      await prepareDatabase();
      await startBackend();
      buildMenu();
      createWindow();
    } catch (error) {
      console.error(error);
      dialog.showErrorBox(
        'Task Manager could not start',
        `${error?.message ?? error}\n\n` +
          `Your data has not been touched. It is stored in:\n${paths.dataDir}`,
      );
      app.quit();
    }
  });
}

app.on('window-all-closed', () => {
  app.quit();
});

app.on('before-quit', async () => {
  if (server) {
    await server.close().catch(() => undefined);
    server = null;
  }
});
