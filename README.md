# leetcode-monorepo

Turborepo + Bun monorepo.

```
apps/
  backend/   express api
  worker/    redis-consuming code-exec worker
  frontend/  react + vite + shadcn (empty, set up separately)
packages/
  db/                   shared prisma schema + client (@repo/db)
  typescript-config/    shared tsconfig base (@repo/typescript-config)
```

## Setup

1. Copy env file and fill in real values, **at the repo root** (not inside
   `apps/backend` or `apps/worker`):
   ```
   cp .env.example .env
   ```
   `packages/db/src/index.ts` explicitly resolves this root `.env` file
   regardless of which app's folder a script is actually run from, so this
   one file covers `DATABASE_URL` (used by `packages/db`) plus `JWT_SECRET`
   and `REDIS_URL` (used by `backend`/`worker` directly via `process.env`).
2. Install deps:
   ```
   bun install
   ```
3. Generate the Prisma client (only needs to happen in one place now):
   ```
   bun run db:generate
   ```
4. Run migrations:
   ```
   bun run db:migrate
   ```
5. Run everything in dev mode:
   ```
   bun run dev
   ```
   This runs `backend` and `worker` in parallel via Turborepo. Add a `dev`
   script to `apps/frontend/package.json` once it exists and it'll be picked
   up automatically.

## Notes on the migration from the old repo

- `prisma/schema.prisma`, the generated client, `@prisma/client`, and
  `@prisma/adapter-pg` used to live in both `backend` and `worker`. They now
  live once in `packages/db`, exported as `@repo/db`. Both apps just do
  `import { prisma } from "@repo/db"`.
- `backend`'s old `db.ts` and `worker`'s old `db.ts` are gone — replaced by
  the single `packages/db/src/index.ts`.
- Fixed a couple of small things while moving code over:
  - `index.ts`'s `app.listen(3000, () => {{ ... }})` had a doubled brace
    (harmless but was creating a stray block statement) — cleaned up.
  - `submission-routes.ts` had both a named and a default export of the
    same router — kept just the named export since that's what
    `routes/index.ts` actually uses.
