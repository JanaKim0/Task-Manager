# Task Manager — build plan

Five stages. Each one ends in a working state worth pushing to GitHub.

---

## Stage 1 — Foundation ✅

Repository, database, and the first end-to-end path: database → API → screen.

- [x] Git repository, `.gitignore`, README
- [x] NestJS backend and Angular frontend scaffolding
- [x] Prisma schema, first migration, seed script
- [x] REST API for workspaces and projects with DTO validation
- [x] Angular routing, HTTP services, workspace list and workspace detail screens

**Learned:** one-to-many relations, migrations, DTO validation, HttpClient,
standalone components, route parameters.

---

## Stage 2 — Boards, columns and cards ✅

Open a project, see its board, manage the work on it.

- [x] `GET /api/boards/:id` returns columns and their cards in one request
- [x] Column API: create, rename, delete
- [x] Card API: create, edit, delete, and `PATCH /cards/:id/toggle` for done
- [x] Every new project is created with a default board and three columns
- [x] Board screen with columns, cards and an inline add-card input
- [x] Card editor: title, description, priority, optional deadline
- [x] Done checkbox with a strike-through style and a progress counter
- [x] Deadline badges coloured by urgency

**Learned:** nested `include` queries, large components, signals and `computed`,
optimistic UI updates, date handling between the browser and the API.

---

## Stage 3 — Notes, checklists and filtering ✅

Make a card a full task and make a busy board readable.

- [x] `Comment` renamed to `Note` — with one user there is no conversation
- [x] Note API: `POST /api/notes`, `DELETE /api/notes/:id`
- [x] Note list inside the card editor, newest first
- [x] `ChecklistItem` model: sub-tasks ticked independently of the card
- [x] Checklist API including `PATCH /api/checklist/:id/toggle`
- [x] `2/5` progress badge on the card, green once every step is ticked
- [x] Filter bar: text search, priority, deadline, "hide done"
- [x] Filtering with `computed` signals — no API call per keystroke
- [x] Empty state when a filter matches nothing
- [x] Default boards dropped the "Done" column

**Learned:** derived state with `computed`, keeping two copies of the same
data in step (the dialog and the board badge), three-state optional fields.

---

## Stage 4 — Drag & drop and release

- [x] Angular CDK drag & drop: cards move within and between columns
- [x] Columns reorder by dragging the grip in their header
- [x] `PATCH /cards/:id/move` and `PATCH /columns/reorder` persist the result
- [x] Optimistic updates with rollback when the request fails
- [x] Dragging pauses while a filter is on, since visible indexes lie
- [x] Loading skeletons shaped like the real board
- [x] `confirm()` replaced by a dialog in the app's own style
- [x] Dismissible error banner that clears itself on the next success
- [x] `GET /api/health` for hosting health checks
- [x] Production environment file and `fileReplacements` wiring
- [ ] Actually deploy — needs accounts, see [DEPLOYMENT.md](DEPLOYMENT.md)

**Learned:** the CDK, renumbering sort order inside a transaction, undoing a
change on the screen when the server refuses it.

---

## Stage 5 — Desktop app

The point of this stage is daily use: an icon on the desktop instead of
starting two terminals and typing a localhost URL.

- [ ] Wrap the app with Electron (or Tauri, if the smaller size wins)
- [ ] Run the API inside the desktop process, not as a separate terminal
- [ ] Move the database to the user's app-data folder so an update cannot
      wipe the tasks
- [ ] Build a Windows installer, add an icon
- [ ] Remember window size and position between launches

**To learn:** packaging, the difference between a dev server and a shipped
binary, where a desktop app is allowed to store user data.

---

## Database schema

```
Workspace
   └──< Project
          └──< Board
                 └──< BoardColumn
                        └──< Card
                               ├──< Note
                               └──< ChecklistItem
```

| Model | Key fields | Notes |
|---|---|---|
| `Workspace` | name, slug (unique), description | top level |
| `Project` | name, description, color | belongs to a workspace |
| `Board` | name, order | belongs to a project |
| `BoardColumn` | name, order | named `BoardColumn` because `Column` is reserved in SQL |
| `Card` | title, description, order, dueDate?, priority, done, completedAt? | `dueDate` is nullable — a card without a deadline is normal |
| `Note` | body, createdAt | no author: single-user app |
| `ChecklistItem` | text, done, order | a sub-task, ticked separately from the card |

Every relation uses `onDelete: Cascade`, so deleting a workspace removes its
projects, boards, columns, cards and comments in one step.

### Why there is no "Done" column

A card can be finished in exactly one way: its checkbox is ticked. Boards
used to ship with a third column called "Done", which meant the app had two
competing answers to "is this task finished?" — a card could sit in "To do"
with a ticked box, or in "Done" without one. The checkbox won because it
also drives the progress counter, and the filter bar can hide finished cards
on demand. Custom columns are still free to be called anything.

### Why there are no users

The first draft had `User`, `Membership` and `CardAssignee` tables. They were
removed in `simplify_to_single_user`: this is a personal planner, so accounts
and assignees added schema complexity without adding anything usable.
