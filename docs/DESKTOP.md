# The desktop app

A double-clickable Windows app instead of two terminals and a localhost URL.

Ready-made installer:
[releases page](https://github.com/JanaKim0/Task-Manager/releases/latest).
Building one yourself is covered at the bottom of this page.

Inside it is the same code: the Electron window shows the Angular interface,
and the NestJS API runs in the same process rather than in a second terminal.

```
Task Manager.exe
 ├── Electron window  ──► http://localhost:<free port>
 └── NestJS server    ──► serves the UI *and* /api, reads the database
                              │
                              └── %APPDATA%\Task Manager\task-manager.db
```

---

## Where your data lives

```
C:\Users\<you>\AppData\Roaming\Task Manager\
├── task-manager.db      ← your workspaces, boards and cards
├── window-state.json    ← window size and position
└── backups\             ← copies of the database, newest 15 kept
```

`File → Open data folder` in the app menu opens this directory.

**Why not next to the program?** Because an update replaces the program
folder. Anything stored there would be replaced with it. The app-data folder
belongs to the user account and survives updates, reinstalls, and
uninstalling — `deleteAppDataOnUninstall` is deliberately off.

### Three separate databases

Working on the project cannot touch the data you use day to day:

| Database | Used by | Path |
|---|---|---|
| Your real data | the installed app | `%APPDATA%\Task Manager\task-manager.db` |
| Development data | `npm run start:dev` | `backend/prisma/dev.db` |
| Throwaway | tests | temporary folders |

`npm run seed` and `prisma migrate reset` only ever touch `dev.db`.

### Backups

Every launch copies the database into `backups\` before anything else
happens — before migrations, before the window opens. The newest 15 are
kept.

To restore one: close the app, open the backups folder, copy the file you
want over `task-manager.db` (rename it), and start the app again.

---

## How the schema is updated

New versions sometimes add columns. The Prisma CLI is a development tool and
is not shipped inside the app, so `desktop/lib/migrate.js` applies the same
`prisma/migrations/*/migration.sql` files itself and records what it has run
in an `_app_migrations` table. Migrations already applied are skipped, so
starting the app is safe at any time.

If a migration ever fails, the app shows the error and refuses to start —
with the backup taken moments earlier still intact.

---

## Running it during development

```bash
cd desktop && npm start
```

This uses `backend/dist` and `frontend/dist`, so build them first after any
code change:

```bash
npm run build --prefix backend && npm run build:desktop --prefix frontend
```

Note it still opens the **real** database in `%APPDATA%`, not `dev.db`. To
experiment without touching your tasks, use the ordinary web version
(`npm run start:dev` + `npm start`).

---

## Building the installer

```bash
cd desktop && npm run dist
```

That runs three steps: builds both halves, gathers them into
`desktop/app-content` (`scripts/stage.js`), then packs everything with
electron-builder. The result is:

```
desktop/release/Task Manager Setup 1.2.0.exe
```

Roughly 150 MB — an Electron app carries its own copy of Chromium, and
Prisma ships a 20 MB query engine.

The installer asks where to install, creates a desktop shortcut and a Start
menu entry, and installs for the current user (no administrator rights
needed).

### The app icon

`desktop/assets/` holds the artwork: `icon.png` for the window and `icon.ico`
— which carries every size from 16 to 256 — for the `.exe`, the installer and
the shortcuts.

Writing an icon into an executable needs electron-builder's `winCodeSign`
toolkit, and that archive contains two macOS symlinks Windows refuses to
create without Developer Mode. Only those two files fail; everything the
Windows build needs extracts fine. If the build stops there, unpack the
archive by hand, skipping the macOS part:

```bash
7za x -xr!darwin "%LOCALAPPDATA%\electron-builder\Cache\winCodeSign\winCodeSign-2.6.0.7z" "-o%LOCALAPPDATA%\electron-builder\Cache\winCodeSign\winCodeSign-2.6.0"
```

Then run `npm run dist` again — the cache is now populated and the download
is skipped. Turning on **Settings → Privacy & security → For developers →
Developer Mode** fixes it for good instead.

---

## What is not done yet

- **Auto-update.** The app does not check for new versions; a new version
  means running a new installer. Data is untouched by that.
- **macOS and Linux builds.** The config only describes Windows. Both are
  mostly a matter of adding targets, but each needs to be built on its own
  operating system.
