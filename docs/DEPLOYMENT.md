# Deployment

The app is two programs, so it goes to two places:

| Part | Host | What it is |
|---|---|---|
| `backend/` | Render | a Node process plus a PostgreSQL database |
| `frontend/` | Vercel | static files produced by `ng build` |

Both have free tiers that are enough for a portfolio link.

> These steps need accounts and passwords, so they are yours to run. The
> code side is already prepared: `render.yaml`, `frontend/vercel.json` and
> `backend/scripts/use-postgres.js` are in the repository.

---

## The one thing to understand first

The repository targets **SQLite**, because that is what the desktop app and
local development use. A hosted server cannot use SQLite — platforms wipe
local files on every deploy — so it needs **PostgreSQL**.

Prisma will not let the provider come from an environment variable, so the
switch happens during the build **on Render only**:

```
npm ci && node scripts/use-postgres.js && npx prisma generate && npm run build
```

`use-postgres.js` rewrites one line in `schema.prisma` on the build machine.
Nothing changes in the repository, so the desktop app keeps working.

The schema is then created with `prisma db push` instead of
`prisma migrate deploy`. The migration files in `prisma/migrations` contain
SQLite SQL, which PostgreSQL cannot execute; `db push` builds the tables
directly from `schema.prisma` and needs no history. That is the right trade
for a demo — and the desktop app, where real data lives, keeps its proper
migrations.

**The deployed site is a showcase, not your planner.** Your tasks live in
the desktop app. Free databases also expire or get cleaned up, so do not
keep anything there you would miss.

---

## 1. Backend on Render

1. Push everything to GitHub — Render deploys from the repository.
2. On [render.com](https://render.com): **New → Blueprint**, pick the
   repository. Render reads `render.yaml` and offers to create both the web
   service and the database.
3. Confirm. The first build takes a few minutes.
4. Open `https://<your-service>.onrender.com/api/health` — it should answer
   `{"status":"ok",...}`.

Doing it by hand instead of the Blueprint: create a PostgreSQL instance,
then a Web Service with root directory `backend`, the build and start
commands from `render.yaml`, health check path `/api/health`, and
`DATABASE_URL` set to the database's *Internal Database URL*. Do not set
`PORT` — Render provides it and `main.ts` already reads it.

> On the free tier the service sleeps when idle, so the first request after
> a pause takes 30–50 seconds. That is the free tier, not a bug. Worth
> mentioning next to the link in your CV.

---

## 2. Frontend on Vercel

1. Put the real API address into
   `frontend/src/environments/environment.production.ts`:

   ```ts
   apiUrl: 'https://your-service.onrender.com/api',
   ```

   `angular.json` swaps this file in for production builds, so `npm start`
   locally still points at `localhost:3333`.

2. Commit and push that change.

3. On [vercel.com](https://vercel.com): **Add New → Project**, pick the
   repository, set **Root Directory** to `frontend`. The rest comes from
   `vercel.json`.

4. Deploy.

---

## 3. Connect the two

Back on Render, set `CORS_ORIGIN` to the address Vercel gave you:

```
CORS_ORIGIN=https://your-app.vercel.app
```

Exactly that — `https://`, no trailing slash, no path. The service restarts
on its own. Without this the browser blocks every request.

---

## 4. Check it end to end

- Open the Vercel address and create a workspace.
- Reload. If it disappeared, the frontend is talking to the wrong API.
- Open the browser console; a CORS complaint means `CORS_ORIGIN` does not
  match the address bar exactly.

---

## Common problems

**"Cannot reach the server" on the live site.** Either the API is asleep
(wait a minute and retry) or `apiUrl` still points at localhost. The Network
tab shows which address is really being called.

**CORS error.** `CORS_ORIGIN` must be the exact origin, protocol included.

**Build fails at `prisma generate`.** Usually `use-postgres.js` did not run —
check that the build command on Render matches `render.yaml`.

**The site works but the board is empty.** Expected: the seed script is not
run in production. Add data through the interface, or run `npm run seed`
once against the production `DATABASE_URL`.

**Did the deploy change my desktop data?** No. Nothing here touches
`%APPDATA%\Task Manager\`, and `use-postgres.js` only ever runs on Render's
build machine. See [DESKTOP.md](DESKTOP.md).
