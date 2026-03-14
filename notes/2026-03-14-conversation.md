# 2026-03-14 Conversation Log

## Context
- Project: `budongsan-v2`
- User goal:
  - Continue Seoul gap backfills by priority (current: 11560)
  - Run geocode/parity after backfill
  - Keep logs and coverage docs up to date

## 1) Yeongdeungpo (`11560`) Gap Backfill (Complete)
- Method: monthly ingest + `db:normalize` after each month
- Executed:
  - 202503: fetched 565, raw inserted 525, norm inserted 530
  - 202504: fetched 389, raw inserted 358, norm inserted 364
  - 202505: fetched 532, raw inserted 492, norm inserted 497
  - 202506: fetched 769, raw inserted 692, norm inserted 697
  - 202507: fetched 257, raw inserted 231, norm inserted 232
  - 202508: fetched 245, raw inserted 234, norm inserted 236
  - 202509: fetched 500, raw inserted 488, norm inserted 489
  - 202510: fetched 458, raw inserted 449, norm inserted 449
  - 202511: fetched 109, raw inserted 109, norm inserted 109
  - 202512: fetched 237, raw inserted 235, norm inserted 235
  - 202601: fetched 264, raw inserted 8, norm inserted 34
  - 202602: fetched 275, raw inserted 116, norm inserted 130
- Status: done (202503~202602, 12/12)

## 2) Post-11560 geocode/parity
- `geocode:maintain` strict PASS
  - total 7589, exact 6083, approx 1506, pending 1249, failed 49, permanentFailed 208
  - exactRatio 0.8016, failRatio 0.0065
  - finishedAt 2026-03-13T16:15:25.958Z (UTC)
- `qa:parity` PASS (72/72)
  - report: `docs/MAP_SEARCH_PARITY_REPORT_2026-03-13.md`
  - data: `docs/MAP_SEARCH_PARITY_REPORT_2026-03-13.json`
  - note: report filename is UTC date

## 3) Docs/Notes updated
- `docs/SEOUL_COVERAGE_PRIORITY_2026-03-10.md`
  - 11560 moved to 완료(12개월 커버)
- `docs/PHASE3_EXECUTION_LOG.md`
  - Added 2026-03-14 execution logs (11560 backfill + post-gate/parity)

## 4) Next Target Command Provided
- Target: Gwanak (`11620`)
- Command provided (PowerShell) to run monthly ingest + normalize, followed by `geocode:maintain` and `qa:parity`

## 5) Gwanak (`11620`) Gap Backfill (Complete)
- Method: monthly ingest + `db:normalize` after each month
- Executed:
  - 202503: fetched 262, raw inserted 245, norm inserted 245
  - 202504: fetched 187, raw inserted 176, norm inserted 176
  - 202505: fetched 231, raw inserted 216, norm inserted 216
  - 202506: fetched 310, raw inserted 302, norm inserted 302
  - 202507: fetched 151, raw inserted 144, norm inserted 144
  - 202508: fetched 149, raw inserted 141, norm inserted 141
  - 202509: fetched 302, raw inserted 293, norm inserted 294
  - 202510: fetched 297, raw inserted 287, norm inserted 289
  - 202511: fetched 103, raw inserted 100, norm inserted 100
  - 202512: fetched 167, raw inserted 162, norm inserted 162
  - 202601: fetched 195, raw inserted 1, norm inserted 10
  - 202602: fetched 210, raw inserted 64, norm inserted 69
- Status: done (202503~202602, 12/12)

## 6) Post-11620 geocode/parity
- `geocode:maintain` strict PASS
  - total 7685, exact 6156, approx 1529, pending 1254, failed 56, permanentFailed 219
  - exactRatio 0.801, failRatio 0.0073
  - finishedAt 2026-03-13T18:10:24.397Z (UTC)
- `qa:parity` PASS (72/72)
  - report: `docs/MAP_SEARCH_PARITY_REPORT_2026-03-13.md`
  - data: `docs/MAP_SEARCH_PARITY_REPORT_2026-03-13.json`
  - note: report filename is UTC date

## 7) Docs/Notes updated
- `docs/SEOUL_COVERAGE_PRIORITY_2026-03-10.md`
  - 11620 moved to 완료(12개월 커버)
- `docs/PHASE3_EXECUTION_LOG.md`
  - Added 2026-03-14 execution logs (11620 backfill + post-gate/parity)

## 8) Jungnang (`11260`) Gap Backfill (Complete)
- Method: monthly ingest + `db:normalize` after each month
- Executed:
  - 202503: fetched 188, raw inserted 175, norm inserted 176
  - 202504: fetched 148, raw inserted 139, norm inserted 140
  - 202505: fetched 195, raw inserted 175, norm inserted 179
  - 202506: fetched 312, raw inserted 257, norm inserted 263
  - 202507: fetched 137, raw inserted 121, norm inserted 121
  - 202508: fetched 134, raw inserted 128, norm inserted 128
  - 202509: fetched 309, raw inserted 247, norm inserted 252
  - 202510: fetched 254, raw inserted 241, norm inserted 246
  - 202511: fetched 101, raw inserted 98, norm inserted 99
  - 202512: fetched 154, raw inserted 153, norm inserted 153
  - 202601: fetched 194, raw inserted 1, norm inserted 46
  - 202602: fetched 180, raw inserted 65, norm inserted 92
- Status: done (202503~202602, 12/12)

## 9) Post-11260 geocode/parity
- `geocode:maintain` strict PASS
  - total 7790, exact 6276, approx 1514, pending 1234, failed 62, permanentFailed 218
  - exactRatio 0.8056, failRatio 0.008
  - finishedAt 2026-03-14T06:36:04.670Z (UTC)
- `qa:parity` PASS (72/72)
  - report: `docs/MAP_SEARCH_PARITY_REPORT_2026-03-14.md`
  - data: `docs/MAP_SEARCH_PARITY_REPORT_2026-03-14.json`
  - note: report filename is UTC date

## 10) Docs/Notes updated
- `docs/SEOUL_COVERAGE_PRIORITY_2026-03-10.md`
  - 11260 moved to 완료(12개월 커버)
- `docs/PHASE3_EXECUTION_LOG.md`
  - Added 2026-03-14 execution logs (11260 backfill + post-gate/parity)

## 11) Dobong (`11320`) Gap Backfill (Complete)
- Method: monthly ingest + `db:normalize` after each month
- Executed:
  - 202503: fetched 176, raw inserted 172, norm inserted 172
  - 202504: fetched 157, raw inserted 150, norm inserted 150
  - 202505: fetched 161, raw inserted 153, norm inserted 154
  - 202506: fetched 308, raw inserted 288, norm inserted 292
  - 202507: fetched 148, raw inserted 136, norm inserted 137
  - 202508: fetched 144, raw inserted 136, norm inserted 136
  - 202509: fetched 200, raw inserted 196, norm inserted 196
  - 202510: fetched 158, raw inserted 156, norm inserted 157
  - 202511: fetched 101, raw inserted 98, norm inserted 98
  - 202512: fetched 144, raw inserted 141, norm inserted 141
  - 202601: fetched 170, raw inserted 0, norm inserted 32
  - 202602: fetched 170, raw inserted 43, norm inserted 54
- Status: done (202503~202602, 12/12)

## 12) Post-11320 geocode/parity
- `geocode:maintain` strict PASS
  - total 7862, exact 6294, approx 1568, pending 1288, failed 61, permanentFailed 219
  - exactRatio 0.8006, failRatio 0.0078
  - finishedAt 2026-03-14T08:18:48.923Z (UTC)
- `qa:parity` PASS (72/72)
  - report: `docs/MAP_SEARCH_PARITY_REPORT_2026-03-14.md`
  - data: `docs/MAP_SEARCH_PARITY_REPORT_2026-03-14.json`
  - note: report filename is UTC date

## 13) Docs/Notes updated
- `docs/SEOUL_COVERAGE_PRIORITY_2026-03-10.md`
  - 11320 moved to 완료(12개월 커버)
- `docs/PHASE3_EXECUTION_LOG.md`
  - Added 2026-03-14 execution logs (11320 backfill + post-gate/parity)

## 8) Conversation Saved
- Requested to save conversation as md under `C:\Users\Sam\Desktop\budongsan-v2\notes`
- Updated this log file accordingly
