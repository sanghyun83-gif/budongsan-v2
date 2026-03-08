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
