# Task Manager

A Trello-style task board built as a portfolio project: workspaces hold
projects, projects hold boards, boards hold columns, and columns hold cards.

Single user by design — no accounts, no logins, no assignees. It is a personal
planner, so everything on screen belongs to whoever runs the app.

### [⬇ Download for Windows](https://github.com/JanaKim0/Task-Manager/releases/latest)

Just download and run the `.exe` — no terminal needed. Windows will warn that
the app is not digitally signed; click **More info → Run anyway**. Your tasks
are kept in `%APPDATA%\Task Manager\`, with a backup on every launch.

## Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | Angular 20 + TypeScript + SCSS | components, routing, reactive forms, signals |
| Backend | NestJS 11 + TypeScript | REST API with the same module/service structure as Angular |
| ORM | Prisma 6 | schema in one file, versioned migrations, typed queries |
| Database | SQLite (PostgreSQL later) | related entities with real foreign keys |

One language across the whole project: **TypeScript**.

## Features

- Workspaces, projects, boards, columns and cards
- Create, edit and delete at every level
- Tick a card off as done, with a live "x of y done" counter
- Optional deadline per card, colour-coded as overdue / today / soon
- Four priority levels
- Checklists inside a card, with a `2/5` progress badge on the board
- Free-form notes on a card
- Filter by text, priority or deadline, and hide finished cards
- Drag cards between columns and drag columns to reorder them
- English and Russian interface, switched without reloading the page
- Two colour themes: soft pink and neutral gray
- Cascading deletes: removing a workspace removes everything inside it

There is no "Done" column: a card is finished when its checkbox is ticked.
Two ways of saying the same thing would only contradict each other.

## Project layout

```
Task Manager/
├── backend/    NestJS API (port 3333)
├── frontend/   Angular SPA (port 4200)
├── desktop/    Electron wrapper — the installable Windows app
└── docs/       roadmap, deployment and desktop notes
```

## Running it !!!

Backend, in the first terminal:

```bash
cd backend && npm install && npx prisma migrate dev && npm run seed && npm run start:dev
```

Frontend, in a second terminal:

```bash
cd frontend && npm install && npm start
```

Then open http://localhost:4200

### Building the desktop app yourself

A ready-made installer is on the
[releases page](https://github.com/JanaKim0/Task-Manager/releases/latest).
To build one from source instead:

```bash
cd desktop && npm install && npm run dist
```

produces `desktop/release/Task Manager Setup 1.0.0.exe` — see
[docs/DESKTOP.md](docs/DESKTOP.md).

Useful extras:

```bash
cd backend && npm run db:studio
```

opens a browser view of the database, and

```bash
cd backend && npm run db:reset
```

wipes it and reloads the demo data.

## Data model

```
                                                        ┌──< Note
Workspace ──< Project ──< Board ──< BoardColumn ──< Card ┤
                                                        └──< ChecklistItem
```

Every arrow is a one-to-many relation with `onDelete: Cascade`, so deleting a
parent cleans up its children instead of leaving orphaned rows.

See [docs/ROADMAP.md](docs/ROADMAP.md) for the full schema and the build plan.

## Progress

- [x] **Stage 1** — foundation: database schema, workspace and project API, Angular shell
- [x] **Stage 2** — boards, columns and cards: full CRUD, done checkbox, deadlines
- [x] **Stage 3** — notes, checklists and board filters
- [x] **Stage 4** — drag & drop and polish
- [x] **Stage 5** — languages, themes and authorship
- [x] **Stage 6** — [desktop app](docs/DESKTOP.md): installer, data kept safe from updates
- [ ] **Stage 7** — release: deployment and a Serbian README

## Author

Built by **Jana Kim** — [github.com/JanaKim0](https://github.com/JanaKim0)

Licensed under the [MIT License](LICENSE). Written with AI assistance
(Claude).
