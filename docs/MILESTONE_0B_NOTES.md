# Milestone 0b — local cloud-ready skeleton

## Added
- `docker-compose.yml`: `postgres` (default), `api` (`--profile full`), `vto` (`--profile vto`)
- `Dockerfile` (Node API production image), `python/Dockerfile` (demo try-on)
- `.dockerignore`
- `server/services/objectStorage.ts`: `STORAGE_MODE=local|s3` boundary (`s3` stubbed)
- `GET /api/health` for container / load-balancer checks
- Static `/uploads` when using local storage
- npm scripts: `docker:db`, `docker:full`, `docker:vto`, `docker:down`

## Day-to-day local workflow
1. `npm run docker:db` — Postgres only
2. Copy `.env.example` → `.env` (Compose DB URL matches)
3. `npm run db:push` then `npm run dev`
4. Optional: `npm run docker:vto` and set `PYTHON_SERVICE_URL=http://localhost:8000`

## Debugger review (0b)

- Cleared default `PYTHON_SERVICE_URL` pointing at a stopped `vto` container (avoids noisy try-on failures).
- Trimmed API request logging for large `/api/chat` and `/api/virtual-try-on` bodies.
- Removed unused `getRoot()` and obsolete port-5000 comments in `server/index.ts`.
- README now documents ordered startup + connection/API map.
