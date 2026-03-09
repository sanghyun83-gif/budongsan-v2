# 2026-03-08 Conversation Log

## Context
- Project: `budongsan-v2`
- Main topics:
  - Naver Search Advisor registration and domain migration (`saljip.kr`)
  - GA4 setup and event instrumentation
  - Gyeonggi coverage issue investigation for Hwaseong (`41590`)

## 1) Naver Search Advisor / Domain Reflection
- Verified project already had:
  - `app/robots.ts`
  - `app/sitemap.ts`
  - `naver-site-verification` meta in `app/layout.tsx`
- Updated base domain fallback/template to `https://saljip.kr`:
  - `app/robots.ts`
  - `app/sitemap.ts`
  - `.env.production.example`
- Updated Naver verification token in `app/layout.tsx` to:
  - `329ee64d10952d1c7fa4ed3e7598725b9dc4aae3`
- User completed deploy and confirmed:
  - `https://saljip.kr/robots.txt`
  - `https://saljip.kr/sitemap.xml`
- Sitemap submitted in Naver Search Advisor.

## 2) GA4 Setup
- Created GA4 web stream for `https://saljip.kr`.
- Measurement ID used:
  - `G-DS7MB8EDCE`
- Added env var in Vercel:
  - `NEXT_PUBLIC_GA_ID=G-DS7MB8EDCE` (Production/Preview)
- Added GA4 gtag integration to `app/layout.tsx` using `next/script` and env-based conditional load.
- User pushed/deployed and verified GA4 Realtime collection.

## 3) GA4 Custom Event Instrumentation
- Implemented client event helper:
  - `lib/analytics.ts`
- Added event tracking:
  - `search` in `components/Explorer.tsx`
  - `view_complex_detail` in `components/DetailActionBar.tsx` (on detail entry)
  - `cta_click` in `components/DetailActionBar.tsx` (CTA button click)
- Realtime verification confirmed events were received.

## 4) Hwaseong (41590) Coverage Issue Investigation
- Initial concern: `41590(화성): fetched 0` in execution logs.
- Added month-targeting options to ingestion script:
  - `--dealYmd=YYYYMM`
  - `--startYmd=YYYYMM --endYmd=YYYYMM`
- Direct MOLIT API sweep over `415xx` revealed:
  - `41590` returns `0`
  - Hwaseong data is served under split codes:
    - `41591`, `41593`, `41595`, `41597`
  - `41597` includes Dongtan-related records (e.g., 청계동/목동/석우동).
- Added alias expansion in `scripts/ingest-molit.mjs`:
  - `41590 -> 41591,41593,41595,41597`
  - `41190 -> 41192,41194,41196`
  - `41170 -> 41171,41173`
- Updated docs:
  - `docs/PHASE3_EXECUTION_LOG.md`
  - `docs/GYEONGGI_COVERAGE_IMPLEMENTATION_PLAN.md`

## 5) Hwaseong Actual Ingestion Execution
- Strategy switched to safer batching: `1 month + 1 code`.
- Executed (202601):
  - `41597`: fetched 999, norm inserted 617
  - `41595`: fetched 243, norm inserted 123
  - `41593`: fetched 134, norm inserted 109
  - `41591`: fetched 114, norm inserted 92
- 202601 subtotal:
  - fetched 1490
  - norm inserted 941
- Ran normalize after batch:
  - `npm run db:normalize` completed.

## Notes
- Large monthly batches on expanded codes can take long; per-code monthly runs are more stable.
- Remaining monthly backfill should continue with the same per-code strategy.

## 6) Additional Execution (Saved)
- Request executed: continue next steps from PHASE3 log.

### 6.1 Hwaseong 202512 Monthly Split Ingestion (real run)
- `41597`: fetched 723, raw inserted 697, norm inserted 714
- `41595`: fetched 200, raw inserted 194, norm inserted 196
- `41593`: fetched 149, raw inserted 144, norm inserted 148
- `41591`: fetched 106, raw inserted 105, norm inserted 106
- subtotal:
  - fetched 1178
  - raw inserted 1140
  - norm inserted 1164

### 6.2 Geocode Maintain Loop (gate recovery)
- 1st additional run:
  - exactRatio 0.7843
  - failRatio 0.0201
  - strict FAIL (`exact < 0.80`)
- 2nd additional run:
  - exactRatio 0.8061
  - failRatio 0.0199
  - strict PASS (`exact >= 0.80`, `fail <= 0.05`)

### 6.3 Parity Re-run
- Command: `npm run qa:parity`
- Result: all PASS
- Previous single failure (`brand_hillstate__seoul_wide__price_asc`) was not reproduced.
- Report files refreshed:
  - `docs/MAP_SEARCH_PARITY_REPORT_2026-03-08.md`
  - `docs/MAP_SEARCH_PARITY_REPORT_2026-03-08.json`

## 7) Additional Follow-up (Saved)

### 7.1 Songpa/Gangdong top-tier verification
- Re-checked target complexes in docs + DB context.
- Result at that point:
  - `Olympic Park Foreon`: source evidence exists in API period scan, but DB inclusion not yet confirmed.
  - `Jamsil Le-El`: no source aptNm match in scanned period.
  - `Jamsil Raemian I-Park`: no source aptNm match in scanned period.

### 7.2 Songpa recent-month backfill and normalization
- Executed backfill for Songpa (`11710`) recent month(s), then normalize.
- Confirmed monthly raw coverage for `202501~202505`:
  - 202505: 388
  - 202504: 131
  - 202503: 913
  - 202502: 716
  - 202501: 323
- Confirmed normalized coverage for same range:
  - 202505: 400
  - 202504: 132
  - 202503: 923
  - 202502: 723
  - 202501: 325

### 7.3 Accuracy gate check after follow-up
- Re-ran `geocode:maintain` and verified strict PASS:
  - exactRatio: 0.8064
  - failRatio: 0.0156

### 7.4 Mapping document update
- Rewrote `docs/ROADMAP_TOPTIER_MAPPING.md` as an ASCII-safe mapping summary to avoid mojibake.
- Included target mapping status and next operational steps.

### 7.5 Logging status
- Added latest operational results to `docs/PHASE3_EXECUTION_LOG.md`:
  - Songpa `202501~202505` coverage check
  - normalize consistency
  - geocode gate pass
  - target complex inclusion check

## 8) Additional Execution (2026-03-10)

### 8.1 Gangdong target backfill completed (`202412~202510`)
- Executed month-by-month ingest for `11740` and normalized after each month.
- Monthly results:
  - 202510: fetched 587, raw inserted 546, norm inserted 551
  - 202509: fetched 837, raw inserted 794, norm inserted 801
  - 202508: fetched 359, raw inserted 338, norm inserted 341
  - 202507: fetched 214, raw inserted 203, norm inserted 205
  - 202506: fetched 988, raw inserted 887, norm inserted 906
  - 202505: fetched 577, raw inserted 517, norm inserted 530
  - 202504: fetched 327, raw inserted 300, norm inserted 304
  - 202503: fetched 660, raw inserted 602, norm inserted 609
  - 202502: fetched 421, raw inserted 390, norm inserted 396
  - 202501: fetched 206, raw inserted 182, norm inserted 187
  - 202412: fetched 259, raw inserted 211, norm inserted 213
- Totals:
  - fetched 5435
  - raw inserted 4970
  - norm inserted 5043

### 8.2 Gate re-check passed
- `npm run geocode:maintain` final metrics:
  - exactRatio: 0.8079
  - failRatio: 0.0167
- Strict gate PASS (`exact >= 0.80`, `fail <= 0.05`).

### 8.3 Parity re-check passed
- `npm run qa:parity` final result: PASS 72/72
- Report files:
  - `docs/MAP_SEARCH_PARITY_REPORT_2026-03-09.md`
  - `docs/MAP_SEARCH_PARITY_REPORT_2026-03-09.json`
