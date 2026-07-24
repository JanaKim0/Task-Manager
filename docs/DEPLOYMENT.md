# Deployment

The app is two separate programs, so it is deployed in two places:

| Part | Host | What it is |
|---|---|---|
| `backend/` | Render | a Node process plus a PostgreSQL database |
| `frontend/` | Vercel | static files built by `ng build` |

Both have free tiers that are enough for a portfolio project.

> Nothing here has been deployed yet. These steps need accounts and
> passwords, so they are yours to run — the code side is already prepared.

---

## 1. Switch the database to PostgreSQL

SQLite is a single file on your laptop; hosting platforms restart containers
and wipe local files, so production needs a real database server.

In `backend/prisma/schema.prisma`, change one line:

```prisma
datasource db {
  provider = "postgresql"   // was "sqlite"
  url      = env("DATABASE_URL")
}
```

Then throw away the old migrations, which contain SQLite-flavoured SQL, and
generate one clean migration against Postgres:

```bash
cd backend && rm -rf prisma/migrations && npx prisma migrate dev --name init
```

To keep working locally you now need Postgres on your machine too — the
easiest way is Docker:

```bash
docker run --name taskmanager-db -e POSTGRES_PASSWORD=dev -p 5432:5432 -d postgres:16
```

and in `backend/.env`:

```
DATABASE_URL="postgresql://postgres:dev@localhost:5432/taskmanager?schema=public"
```

**Do this on a branch.** If it turns into a fight, `git switch main` puts the
working SQLite version back.

---

## 2. Backend on Render

1. Push everything to GitHub first — Render deploys from the repository.
2. Create a **PostgreSQL** instance on Render and copy its *Internal Database
   URL*.
3. Create a **Web Service** from the same repository with:

   | Setting | Value |
   |---|---|
   | Root directory | `backend` |
   | Build command | `npm install && npx prisma generate && npm run build` |
   | Start command | `npx prisma migrate deploy && npm run start:prod` |
   | Health check path | `/api/health` |

4. Add environment variables:

   ```
   DATABASE_URL   <the Internal Database URL from step 2>
   CORS_ORIGIN    https://your-app.vercel.app
   ```

   Do not set `PORT` — Render provides it, and `main.ts` already reads it.

`prisma migrate deploy` in the start command applies migrations on every
release. Unlike `migrate dev` it never asks questions and never resets data,
which is exactly what production needs.

Once it is live, open `https://your-api.onrender.com/api/health` — it should
answer `{"status":"ok",...}`.

> On the free tier the service sleeps after inactivity, so the first request
> after a pause takes 30-50 seconds. That is the free tier, not a bug.

---

## 3. Frontend on Vercel

1. Put the real API address into `frontend/src/environments/environment.production.ts`:

   ```ts
   apiUrl: 'https://your-api.onrender.com/api',
   ```

   `angular.json` swaps this file in for production builds, so the local
   `npm start` keeps pointing at `localhost:3333`.

2. Import the repository into Vercel with:

   | Setting | Value |
   |---|---|
   | Root directory | `frontend` |
   | Framework preset | Angular |
   | Build command | `npm run build` |
   | Output directory | `dist/frontend/browser` |

3. Deploy, then go back to Render and set `CORS_ORIGIN` to the address Vercel
   gave you. Without that the browser blocks every request.

---

## 4. Check it end to end

- Open the Vercel address and create a workspace.
- Reload the page — it should still be there. If it is not, the frontend is
  talking to the wrong API.
- Open the browser console. A CORS complaint means `CORS_ORIGIN` does not
  match the address in the address bar exactly, protocol included.

---

## Common problems

**"Cannot reach the server" on the deployed site.** Either the API is asleep
(wait a minute) or `apiUrl` still points at localhost. Check the Network tab
to see which address is actually being called.

**CORS error.** `CORS_ORIGIN` must be the exact origin: `https://app.vercel.app`,
no trailing slash, no path.

**Migrations fail on deploy.** Almost always leftover SQLite migrations. They
have to be regenerated after switching the provider, see step 1.

**Everything works but the board is empty.** Expected — the seed script is
not run in production. Add the data through the interface, or run
`npm run seed` once against the production `DATABASE_URL` if you want the
demo content.
