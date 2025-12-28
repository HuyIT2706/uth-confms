# Copilot / AI Agent Instructions — UTH ConFMS

Purpose: Provide focused, actionable guidance so an AI coding agent is immediately productive in this monorepo.

---

## Big picture (what this repo is)
- Monorepo of small NestJS microservices (apps/*) and a React/Vite client (client/).
- Services of note:
  - `identity-service` — user/auth (Postgres + TypeORM + JWT)
  - `api-gateway` — simple gateway placeholder
  - `conference-service`, `review-service`, `submission-service` — domain services
- Projects are configured as a Nest monorepo (see `nest-cli.json`) — each `apps/<project>` is a separate Nest application.
- DB: PostgreSQL used via Docker (see `docker-compose.yml`). Identity service uses TypeORM with `synchronize: true` (dev convenience).

## Important files & places to inspect
- Project config & entry points
  - `nest-cli.json` — monorepo projects and entry files
  - `apps/*/src/main.ts` — service bootstrap (note: all use `app.setGlobalPrefix('api')`)
  - `apps/identity-service/Dockerfile` and `docker-compose.yml` — how the service is built & run in Docker
- Environment and config
  - `apps/identity-service/.env` — DB, JWT secrets, and PORTs for identity service
  - `apps/identity-service/src/identity-service.module.ts` — `ConfigModule.forRoot({ envFilePath: [...] })` (app-specific `.env` is loaded first)
- Auth & DB patterns
  - `apps/identity-service/src/auth/` — JWT strategy, controller, DTOs, refresh token entity
  - `apps/identity-service/src/users/` — User entity, repository usage (`@nestjs/typeorm` + `Repository`)
- Tests & tooling
  - Root `package.json` — scripts: `build`, `start`, `start:dev`, `test`, `lint`, `format`
  - Jest is configured to run tests under `apps/` (see `package.json` `jest.roots`)

## Developer workflows & exact commands (examples)
- Build a single Nest app (matches Dockerfile usage):
  - npm run build -- <project>
  - Example (used in Dockerfile): `npm run build -- identity-service` -> produces `dist/apps/identity-service`
- Run a single service in dev (Nest CLI project flag):
  - `npm run start:dev -- --project identity-service`  (passes `--project` to `nest start --watch`)
- Run tests:
  - `npm test` (root, runs jest across `apps/`)
  - `npm run test:watch` / `npm run test:cov`
- Lint & format:
  - `npm run lint` (eslint)
  - `npm run format` (prettier)
- Run services in Docker (recommended for DB integration):
  - `docker compose up --build` (or `docker-compose up --build` if using the older CLI)
  - `docker-compose.yml` defines `postgres` and `identity-service` services and mounts `database/init-scripts` into Postgres init dir.

## Project-specific conventions and gotchas
- Environment files
  - Each service may depend on an app-specific `.env` (e.g., `apps/identity-service/.env`) and the `ConfigModule` is configured to load the app `.env` first.
  - In `apps/identity-service/.env`, variables used:
    - `DB_HOST/DB_PORT/DB_USERNAME/DB_PASSWORD/DB_DATABASE`
    - `JWT_ACCESS_SECRET`, `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_SECRET`, `JWT_REFRESH_EXPIRES_IN`
    - `PORT` is present, but note: service `main.ts` uses `process.env.port ?? <default>` (lowercase `port`) — be careful when relying on `PORT` in other contexts.
  - Comments in `.env` use `//` which is nonstandard for dotenv (prefer `#`). This can confuse tools expecting `#` comments.

- Port naming quirk
  - Each `main.ts` uses `process.env.port` (lowercase). When setting environment variables, ensure either `port` is set or the fallback default will be used.

- Crypto polyfill
  - `identity-service` adds global `crypto` and `randomUUID` when missing (in `main.ts`) and the Docker image sets `NODE_OPTIONS=--experimental-global-webcrypto`. This is intentional to support libraries requiring WebCrypto on Node 18.

- TypeORM & schema changes
  - `synchronize: true` is used in dev (`identity-service.module.ts`) — convenient for development but unsafe for production. Note this if you are writing migrations or changing entities.

- JWT defaults
  - `JwtStrategy` falls back to `'access_secret'` when env is missing — tests or dev flows may rely on that fallback.

- Test locations
  - Unit tests live next to source (`*.spec.ts` under `apps/*/src`)
  - A root `test:e2e` script exists; check `apps/uth-confms/test/jest-e2e.json` if needing to run e2e suites.

## Integration points & external services
- Postgres (via `docker-compose.yml`) — the DB container maps host port 5432
- No distributed message bus or HTTP proxy currently in the repo (API gateway is minimal). Look for `http-proxy-middleware` in `package.json` if you add proxied routes in `client` or gateway.

## How to approach common tasks (examples the agent may be asked to perform)
- Add a new field to `User` entity:
  1. Add column to `apps/identity-service/src/users/entities/user.entity.ts`
  2. Update DTOs in `auth/dto` or `users` controller/service as needed
  3. Run the app with Docker (or run locally and let TypeORM `synchronize` update schema) and run unit tests

- Fix failing DB connection locally:
  - Ensure Postgres is running (`docker compose up postgres`) and that `apps/identity-service/.env` DB_* values match Docker compose values

- Investigate auth issues:
  - Check `apps/identity-service/src/auth/jwt.strategy.ts` and confirm `JWT_ACCESS_SECRET` in `.env` or rely on the fallback for reproducing tests

## Safety & priorities for automated changes
- Avoid changing `synchronize` to `false` without adding a migration plan — this repository relies on it for local development.
- Do not commit secrets (if you modify `.env` defaults, keep placeholders or refer to CI secrets).

---

If anything is unclear or you'd like more explicit examples (e.g., sample `npm run` invocations for other apps, or a quick checklist for running the identity-service end-to-end locally), tell me which part to expand and I’ll update this file. ✅
