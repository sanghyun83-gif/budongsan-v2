# 2026-03-12 Conversation Log

## Context
- Project: `budongsan-v2`
- User goal:
  - Continue Seoul gap backfills by priority (11290, 11530)
  - Run geocode/parity after each backfill
  - Keep logs and coverage docs up to date

## 1) Seongbuk (`11290`) Gap Backfill (Complete)
- Method: monthly ingest + `db:normalize` after each month
- Executed:
  - 202503: fetched 455, raw inserted 410, norm inserted 415
  - 202504: fetched 346, raw inserted 320, norm inserted 322
  - 202505: fetched 475, raw inserted 424, norm inserted 434
  - 202506: fetched 660, raw inserted 605, norm inserted 620
  - 202507: fetched 232, raw inserted 209, norm inserted 213
  - 202508: fetched 362, raw inserted 314, norm inserted 343
  - 202509: fetched 545, raw inserted 517, norm inserted 522
  - 202510: fetched 514, raw inserted 492, norm inserted 493
  - 202511: fetched 207, raw inserted 198, norm inserted 198
  - 202512: fetched 322, raw inserted 311, norm inserted 314
- Status: done (202503~202602, 12/12)

## 2) Post-11290 geocode/parity
- `geocode:maintain` strict PASS
  - total 6566, exact 5267, approx 1299, pending 1053, failed 27, permanentFailed 182
  - exactRatio 0.8022, failRatio 0.0041
- `qa:parity` PASS (72/72)
  - report: `docs/MAP_SEARCH_PARITY_REPORT_2026-03-12.md`
  - data: `docs/MAP_SEARCH_PARITY_REPORT_2026-03-12.json`

## 3) Guro (`11530`) Gap Backfill (Complete)
- Method: monthly ingest + `db:normalize` after each month
- Executed:
  - 202503: fetched 359, raw inserted 329, norm inserted 331
  - 202504: fetched 280, raw inserted 260, norm inserted 265
  - 202505: fetched 691, raw inserted 368, norm inserted 670
  - 202506: fetched 495, raw inserted 454, norm inserted 464
  - 202507: fetched 219, raw inserted 200, norm inserted 203
  - 202508: fetched 228, raw inserted 218, norm inserted 220
  - 202509: fetched 350, raw inserted 333, norm inserted 335
  - 202510: fetched 347, raw inserted 339, norm inserted 339
  - 202511: fetched 165, raw inserted 164, norm inserted 164
  - 202512: fetched 283, raw inserted 277, norm inserted 278
- Status: done (202503~202602, 12/12)

## 4) Post-11530 geocode/parity
- `geocode:maintain` strict PASS
  - total 6727, exact 5424, approx 1303, pending 1091, failed 22, permanentFailed 190
  - exactRatio 0.8063, failRatio 0.0033
- `qa:parity` PASS (72/72)
  - report: `docs/MAP_SEARCH_PARITY_REPORT_2026-03-12.md`
  - data: `docs/MAP_SEARCH_PARITY_REPORT_2026-03-12.json`

## 5) Docs/Notes updated
- `docs/SEOUL_COVERAGE_PRIORITY_2026-03-10.md`
  - 11290, 11530 moved to 완료(12개월 커버)
- `docs/PHASE3_EXECUTION_LOG.md`
  - Added 2026-03-12 execution logs (11290 + 11530 backfill and post-gate/parity)
- `notes/2026-03-12-conversation.md` updated

## 6) Eunpyeong (`11380`) Gap Backfill (Complete)
- Method: monthly ingest + `db:normalize` after each month
- Executed:
  - 202503: fetched 280, raw inserted 0, norm inserted 51
  - 202504: fetched 198, raw inserted 192, norm inserted 192
  - 202505: fetched 254, raw inserted 236, norm inserted 239
  - 202506: fetched 418, raw inserted 389, norm inserted 395
  - 202507: fetched 215, raw inserted 193, norm inserted 197
  - 202508: fetched 218, raw inserted 200, norm inserted 203
  - 202509: fetched 317, raw inserted 302, norm inserted 302
  - 202510: fetched 381, raw inserted 363, norm inserted 368
  - 202511: fetched 188, raw inserted 177, norm inserted 179
  - 202512: fetched 219, raw inserted 211, norm inserted 212
  - 202601: fetched 272, raw inserted 2, norm inserted 51
  - 202602: fetched 288, raw inserted 86, norm inserted 130
- Status: done (202503~202602, 12/12)

## 7) Post-11380 geocode/parity
- `geocode:maintain` strict PASS
  - total 6908, exact 5554, approx 1354, pending 1138, failed 28, permanentFailed 188
  - exactRatio 0.804, failRatio 0.0041
- `qa:parity` PASS (72/72)
  - report: `docs/MAP_SEARCH_PARITY_REPORT_2026-03-12.md`
  - data: `docs/MAP_SEARCH_PARITY_REPORT_2026-03-12.json`
  - note: report date is UTC (finishedAt 2026-03-12T16:45:49.075Z)

## 8) Docs/Notes updated
- `docs/SEOUL_COVERAGE_PRIORITY_2026-03-10.md`
  - 11380 moved to 완료(12개월 커버)
- `docs/PHASE3_EXECUTION_LOG.md`
  - Added 2026-03-13 execution logs (11380 backfill + post-gate/parity)

## 9) Gangseo (`11500`) Gap Backfill (Complete)
- Method: monthly ingest + `db:normalize` after each month
- Executed:
  - 202503: fetched 462, raw inserted 429, norm inserted 435
  - 202504: fetched 359, raw inserted 332, norm inserted 339
  - 202505: fetched 508, raw inserted 435, norm inserted 438
  - 202506: fetched 605, raw inserted 573, norm inserted 577
  - 202507: fetched 270, raw inserted 237, norm inserted 239
  - 202508: fetched 285, raw inserted 271, norm inserted 272
  - 202509: fetched 604, raw inserted 592, norm inserted 593
  - 202510: fetched 603, raw inserted 583, norm inserted 587
  - 202511: fetched 188, raw inserted 182, norm inserted 182
  - 202512: fetched 316, raw inserted 300, norm inserted 300
  - 202601: fetched 373, raw inserted 15, norm inserted 67
  - 202602: fetched 314, raw inserted 208, norm inserted 221
- Status: done (202503~202602, 12/12)

## 10) Post-11500 geocode/parity
- `geocode:maintain` strict PASS
  - total 7133, exact 5753, approx 1380, pending 1138, failed 35, permanentFailed 207
  - exactRatio 0.8065, failRatio 0.0049
- `qa:parity` PASS (72/72)
  - report: `docs/MAP_SEARCH_PARITY_REPORT_2026-03-12.md`
  - data: `docs/MAP_SEARCH_PARITY_REPORT_2026-03-12.json`
  - note: report date is UTC (finishedAt 2026-03-12T18:12:25.154Z)

## 11) Docs/Notes updated
- `docs/SEOUL_COVERAGE_PRIORITY_2026-03-10.md`
  - 11500 moved to 완료(12개월 커버)
- `docs/PHASE3_EXECUTION_LOG.md`
  - Added 2026-03-13 execution logs (11500 backfill + post-gate/parity)
