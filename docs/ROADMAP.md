# Task Manager — build plan

Four stages. Each one ends in a working state worth pushing to GitHub.

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

## Stage 3 — Comments and filtering

Make a card a full task and make a busy board readable.

- [ ] Comment API: `GET/POST/DELETE /api/cards/:id/comments`
- [ ] Comment list inside the card editor
- [ ] Filter bar: by text, priority, deadline, done / not done
- [ ] Filtering with `computed` signals, no extra API calls
- [ ] "Hide completed cards" toggle
- [ ] Empty state when a filter matches nothing

**To learn:** derived state, more complex template logic, query parameters.

---

## Stage 4 — Drag & drop and release

- [ ] Angular CDK `DragDropModule`: drag cards between columns
- [ ] Drag columns to reorder them
- [ ] Persist the new position through the API
- [ ] Optimistic updates with rollback on failure
- [ ] Responsive layout and loading skeletons
- [ ] Deploy: backend on Render, frontend on Vercel, PostgreSQL database

**To learn:** the CDK, recalculating sort order, error recovery.

---

## Database schema

```
Workspace
   └──< Project
          └──< Board
                 └──< BoardColumn
                        └──< Card
                               └──< Comment
```

| Model | Key fields | Notes |
|---|---|---|
| `Workspace` | name, slug (unique), description | top level |
| `Project` | name, description, color | belongs to a workspace |
| `Board` | name, order | belongs to a project |
| `BoardColumn` | name, order | named `BoardColumn` because `Column` is reserved in SQL |
| `Card` | title, description, order, dueDate?, priority, done, completedAt? | `dueDate` is nullable — a card without a deadline is normal |
| `Comment` | body, createdAt | no author: single-user app |

Every relation uses `onDelete: Cascade`, so deleting a workspace removes its
projects, boards, columns, cards and comments in one step.

### Why there are no users

The first draft had `User`, `Membership` and `CardAssignee` tables. They were
removed in `simplify_to_single_user`: this is a personal planner, so accounts
and assignees added schema complexity without adding anything usable.
