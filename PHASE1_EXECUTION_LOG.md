# Phase 1 Execution Log - MVP-1

- Date: 2026-02-28
- Scope: Data persistence + search API foundation

## Completed in this run

1. PostgreSQL client dependencies added
- `pg`
- `@types/pg`

2. DB migration file created
- `sql/001_init.sql`
- Includes: PostGIS extension, core/product/platform tables, indexes

3. DB utility added
- `lib/db.ts`
- Features:
  - `DATABASE_URL` presence check
  - pooled connection singleton
  - TLS behavior for cloud/local

4. `/api/map/complexes` switched to DB-first
- File: `app/api/map/complexes/route.ts`
- Behavior:
  - If `DATABASE_URL` set: query `complex + latest deal` with bbox
  - If not set: fallback response (temporary)

5. `/api/search` API added
- File: `app/api/search/route.ts`
- Supports:
  - `q`, `region`, `min_price`, `max_price`, `page`, `size`
  - DB query with latest deal join and pagination

## Pending next actions

1. Set `DATABASE_URL` in `.env.local` and Vercel
2. Run `sql/001_init.sql` on PostgreSQL/PostGIS
3. Ingestion job:
- ingest MOLIT -> `deal_trade_raw`
- normalize -> `deal_trade_normalized`
4. Update `API_SPEC.md` with `/api/search` finalized contract if needed
5. Add p95 measurement script/report

## Verification commands

```powershell
npm run lint
npm run build
npm run dev
```

API checks:
- `/api/map/complexes?sw_lat=37.0&sw_lng=126.4&ne_lat=37.8&ne_lng=127.5`
- `/api/search?q=래미안&page=1&size=20`

## Live execution result (2026-02-28)

1. `/api/search?q=래미안&page=1&size=5`
- Status: `503`
- Body: `DB_NOT_CONFIGURED` (`DATABASE_URL is not configured`)

2. `/api/map/complexes?...&limit=5`
- Status: `200`
- Source: `fallback`
- Body includes warning that DB is not configured

3. Conclusion
- Runtime path works as designed:
  - Search API requires DB
  - Map API uses DB-first and temporary fallback without DB

4. Immediate unblock
- Add `DATABASE_URL` to `.env.local` and Vercel env
- Apply `sql/001_init.sql` to PostgreSQL/PostGIS

## Seed execution result (2026-02-28)

1. Added files
- `sql/002_seed.sql` (minimal seed for search/map verification)
- `scripts/run-sql.mjs` (apply SQL to `DATABASE_URL`)

2. Execution
- Command: `node scripts/run-sql.mjs sql/002_seed.sql`
- Result: applied successfully

3. Verification (local)
- `GET /api/search?q=래미안&page=1&size=5`
  - Status: `200`
  - Count: `2`
- `GET /api/map/complexes?sw_lat=37.0&sw_lng=126.4&ne_lat=37.8&ne_lng=127.5&limit=5`
  - Status: `200`
  - Source: `database`
  - Count: `3`
