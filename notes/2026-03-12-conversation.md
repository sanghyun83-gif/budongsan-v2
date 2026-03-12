# 2026-03-12 Conversation Log

## Context
- Project: `budongsan-v2`
- User goal:
  - Gwangjin(11215) 12개월 커버 완료
  - geocode/parity 재확인
  - 문서/로그 갱신

## 1) Gwangjin (`11215`) 12개월 커버 완료
- Method: monthly ingest + `db:normalize` after each month
- Executed (additional months):
  - 202510: fetched 273, raw inserted 249, norm inserted 264
  - 202511: fetched 38, raw inserted 36, norm inserted 37
  - 202512: fetched 67, raw inserted 63, norm inserted 64
  - 202601: fetched 67, raw inserted 2, norm inserted 12
  - 202602: fetched 58, raw inserted 17, norm inserted 20
- Status: done (202503~202602, 12/12)

## 2) geocode/parity (re-run)
- `geocode:maintain` strict PASS
  - total 6452, exact 5204, approx 1248, pending 1025, failed 37, permanentFailed 186
  - exactRatio 0.8066, failRatio 0.0057
- `qa:parity` PASS (72/72)
  - report: `docs/MAP_SEARCH_PARITY_REPORT_2026-03-11.md`
  - data: `docs/MAP_SEARCH_PARITY_REPORT_2026-03-11.json`

## 3) Docs/Notes updated
- `docs/SEOUL_COVERAGE_PRIORITY_2026-03-10.md`
  - Restored UTF-8 after encoding break
  - Moved 11215 + 11350 to 완료(12개월 커버)
  - Removed duplicate update note
- `docs/PHASE3_EXECUTION_LOG.md`
  - Added 2026-03-12 execution logs (11215 completion + geocode/parity rerun)
- `notes/2026-03-11-conversation.md` updated to include 12/12 completion and rerun metrics

## 4) Nowon (`11350`) Gap Backfill (Complete)
- Method: monthly ingest + `db:normalize` after each month
- Executed:
  - 202503: fetched 601, raw inserted 0, norm inserted 45
  - 202504: fetched 418, raw inserted 393, norm inserted 394
  - 202505: fetched 570, raw inserted 540, norm inserted 542
  - 202506: fetched 885, raw inserted 0, norm inserted 82
  - 202507: fetched 342, raw inserted 321, norm inserted 324
  - 202508: fetched 384, raw inserted 368, norm inserted 370
  - 202509: fetched 591, raw inserted 572, norm inserted 573
  - 202510: fetched 665, raw inserted 644, norm inserted 648
  - 202511: fetched 235, raw inserted 234, norm inserted 234
  - 202512: fetched 514, raw inserted 490, norm inserted 507
- Status: done (202503~202602, 12/12)

## 5) 2026-03-12 geocode/parity (post-11350)
- `geocode:maintain` strict PASS
  - total 6529, exact 5267, approx 1262, pending 1053, failed 27, permanentFailed 182
  - exactRatio 0.8067, failRatio 0.0041
- `qa:parity` PASS (72/72)
  - report: `docs/MAP_SEARCH_PARITY_REPORT_2026-03-12.md`
  - data: `docs/MAP_SEARCH_PARITY_REPORT_2026-03-12.json`
