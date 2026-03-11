# 2026-03-11 Conversation Log

## Context
- Project: `budongsan-v2`
- User goal:
  - Continue Seoul gap backfills by priority
  - Start Gwangjin (`11215`) monthly backfill
  - Save conversation notes

## 1) Gwangjin (`11215`) Gap Backfill (Complete)
- Method: monthly batch ingest + `db:normalize` after each month
- Executed:
  - 202503: fetched 260, raw inserted 248, norm inserted 248
  - 202504: fetched 177, raw inserted 160, norm inserted 160
  - 202505: fetched 254, raw inserted 232, norm inserted 232
  - 202506: fetched 356, raw inserted 0, norm inserted 21
  - 202507: fetched 82, raw inserted 75, norm inserted 75
  - 202508: fetched 106, raw inserted 98, norm inserted 99
  - 202509: fetched 306, raw inserted 289, norm inserted 290
  - 202510: fetched 273, raw inserted 249, norm inserted 264
  - 202511: fetched 38, raw inserted 36, norm inserted 37
  - 202512: fetched 67, raw inserted 63, norm inserted 64
  - 202601: fetched 67, raw inserted 2, norm inserted 12
  - 202602: fetched 58, raw inserted 17, norm inserted 20
- Status: done (202503~202602, 12/12)

## 2) Pending Next Steps
- None (geocode/parity completed on 2026-03-12 KST)

## 3) 2026-03-12 geocode/parity
- `geocode:maintain` strict PASS
  - total 6444, exact 5157, approx 1287, pending 1067, failed 34, permanentFailed 186
  - exactRatio 0.8003, failRatio 0.0053
- `qa:parity` PASS (72/72)
  - report: `docs/MAP_SEARCH_PARITY_REPORT_2026-03-11.md`
  - data: `docs/MAP_SEARCH_PARITY_REPORT_2026-03-11.json`

## 4) 2026-03-12 geocode/parity (rerun)
- `geocode:maintain` strict PASS
  - total 6452, exact 5204, approx 1248, pending 1025, failed 37, permanentFailed 186
  - exactRatio 0.8066, failRatio 0.0057
- `qa:parity` PASS (72/72)
  - report: `docs/MAP_SEARCH_PARITY_REPORT_2026-03-11.md`
  - data: `docs/MAP_SEARCH_PARITY_REPORT_2026-03-11.json`
