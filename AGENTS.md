# AGENTS.md

VisaFlow: a Turborepo monorepo (pnpm 11) for a visa-application platform.

## Layout

- `apps/api` — NestJS 11 REST API, defaults to port 4000, routes under `/api/v1`, Swagger at `/api/docs` (non-prod).
- `apps/web` — Next.js 16 app, port 3000. `app/` router under `app/dashboard/`.
- `packages/database` — Drizzle ORM schema + migrations + the shared DB client (`db`) singleton.
- `packages/config`, `shared-types`, `validators`, `ui`, `eslint-config`, `typescript-config` — consumed as **built `dist/`**, not source.

`apps/api` and `apps/web` import workspace packages via their `dist` output, so rebuild a package after changing its source (see Commands). `@visaflow/ui`, `shared-types`, `config`, `validators` are also in `next.config.ts` `transpilePackages`.

## Commands

| Task | Command | Notes |
|---|---|---|
| Dev (all) | `pnpm dev` | runs api + web + database `tsup --watch` concurrently |
| Dev (one app) | `pnpm --filter @visaflow/web dev` | also `@visaflow/api`, `@visaflow/database` |
| Build | `pnpm build` | `database` builds to `dist` with tsup |
| Lint | `pnpm lint` | **API `lint` runs `eslint --fix` and auto-rewrites files**; web/ui use `--max-warnings 0` |
| Typecheck | `pnpm check-types` | exists on web, database, ui — **not on api** |
| Test | `pnpm test` | api = jest (`*.spec.ts`); database/config/ui/shared-types/validators = vitest (`*.test.ts`); **web has no tests** |

## Database & migrations

- `DATABASE_URL` is required for everything DB/API related; it lives in the root `.env` (ignored by git). Both `packages/database` config and `apps/api` load env from multiple cwd-relative candidates, so running via `--filter` matters.
- Migration history is **currently inconsistent** (this is a known landmine):
  - `drizzle/meta/_journal.json` references `0002_harsh_whirlwind` and `0003_internal_wallet`, but migration `0001` is missing and `0002_harsh_whirlwind.sql` exists only in the working tree (untracked, not committed).
  - Do **not** run `git clean -fd` or rewrite journal/snapshot files. Prefer `db:push` for local iteration; if you regenerate, commit the `.sql`, snapshot, and journal together.
  - Ad-hoc troubleshooting scripts (`check-db.ts`, `fix-db.ts`, `check-migrations.ts`, `fix-migrations.ts`, `check-enum.ts`) sit at `packages/database/` root — scratch, don't commit or depend on them.
- Commands (run from root; turbo runs them in `packages/database`):
  - `pnpm db:migrate` — programmatic (`tsx src/migrate.ts`), replays in journal order.
  - `pnpm db:push` — `drizzle-kit push`, syncs schema directly; handy for dev, drifts the journal.
  - `pnpm db:generate` — `drizzle-kit generate`, outputs SQL under `packages/database/drizzle`.
  - `pnpm db:seed` — `tsx src/seeds/run.ts` (countries, visa types, requirements, eligibility). `src/seeds/new-run.ts` is gitignored leftover.
- `drizzle.config.ts` strips a Prisma-style `schema=` query param from `DATABASE_URL` before connecting; don't reintroduce it.
- Postgres for local dev: `docker compose up -d` (db `drizzle_turbo_db`, user/pass `postgres`/`postgres`).

## Env & services

- `apps/api` works without Redis: `REDIS_ENABLED=false` disables Bull queues and falls back to in-memory cache. With Redis, host/port/password come from env (`REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`).
- pnpm 11 only runs postinstall/build scripts for packages allowlisted in `pnpm-workspace.yaml` `allowBuilds`. If you add a dependency with a native/postinstall build step, add it there or the build silently won't run.
- Document storage uses Cloudflare R2 — see `docs/cloudflare-r2-documents.md` before touching `apps/api/src/common/storage/`.

## Conventions

- API: global `ValidationPipe` with `whitelist` + `forbidNonWhitelisted` (returns 422), a response-transform interceptor wraps payloads — the web client (`apps/web/lib/api.ts`) unwraps it. Uses URI versioning (`api/v1`).
- API shares the DB client imported as `db` from `@visaflow/database` (see `apps/api/src/common/database/database.service.ts`); it owns no separate pool.
- Web: zustand for client state (`apps/web/store/`), react-query for server state; `NEXT_PUBLIC_API_URL` defaults to `http://localhost:4000` (see `packages/config/src/index.ts`).
- Format with Prettier (`pnpm format`).
- Ignore these root items — they're not part of the repo: `agent/`, `fix.md` (both gitignored), and the untracked `visaflow-ui-and-codex-package/` directory.