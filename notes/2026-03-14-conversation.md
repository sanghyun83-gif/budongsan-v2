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

## 14) Dongjak (`11590`) Gap Backfill (Complete)
- Method: monthly ingest + `db:normalize` after each month
- Executed:
  - 202503: fetched 577, raw inserted 534, norm inserted 552
  - 202504: fetched 390, raw inserted 369, norm inserted 377
  - 202505: fetched 528, raw inserted 486, norm inserted 500
  - 202506: fetched 663, raw inserted 614, norm inserted 638
  - 202507: fetched 148, raw inserted 141, norm inserted 142
  - 202508: fetched 215, raw inserted 203, norm inserted 207
  - 202509: fetched 497, raw inserted 486, norm inserted 490
  - 202510: fetched 429, raw inserted 408, norm inserted 417
  - 202511: fetched 83, raw inserted 77, norm inserted 77
  - 202512: fetched 146, raw inserted 145, norm inserted 145
  - 202601: fetched 198, raw inserted 9, norm inserted 80
  - 202602: fetched 152, raw inserted 77, norm inserted 101
- Status: done (202503~202602, 12/12)

## 15) Post-11590 geocode/parity
- `geocode:maintain` strict PASS
  - total 7943, exact 6382, approx 1561, pending 1275, failed 65, permanentFailed 221
  - exactRatio 0.8035, failRatio 0.0082
  - finishedAt 2026-03-14T09:32:53.789Z (UTC)
- `qa:parity` PASS (72/72)
  - report: `docs/MAP_SEARCH_PARITY_REPORT_2026-03-14.md`
  - data: `docs/MAP_SEARCH_PARITY_REPORT_2026-03-14.json`
  - note: report filename is UTC date

## 16) Docs/Notes updated
- `docs/SEOUL_COVERAGE_PRIORITY_2026-03-10.md`
  - 11590 moved to 완료(12개월 커버)
- `docs/PHASE3_EXECUTION_LOG.md`
  - Added 2026-03-14 execution logs (11590 backfill + post-gate/parity)

## 17) Gangbuk (`11305`) Gap Backfill (Complete)
- Method: monthly ingest + `db:normalize` after each month
- Executed:
  - 202503: fetched 104, raw inserted 100, norm inserted 103
  - 202504: fetched 102, raw inserted 91, norm inserted 95
  - 202505: fetched 128, raw inserted 113, norm inserted 113
  - 202506: fetched 179, raw inserted 163, norm inserted 167
  - 202507: fetched 87, raw inserted 80, norm inserted 83
  - 202508: fetched 94, raw inserted 90, norm inserted 91
  - 202509: fetched 120, raw inserted 116, norm inserted 117
  - 202510: fetched 123, raw inserted 120, norm inserted 120
  - 202511: fetched 73, raw inserted 71, norm inserted 72
  - 202512: fetched 117, raw inserted 115, norm inserted 116
  - 202601: fetched 125, raw inserted 4, norm inserted 18
  - 202602: fetched 145, raw inserted 42, norm inserted 67
- Status: done (202503~202602, 12/12)

## 18) Post-11305 geocode/parity
- `geocode:maintain` strict PASS
  - total 7992, exact 6418, approx 1574, pending 1284, failed 66, permanentFailed 224
  - exactRatio 0.8031, failRatio 0.0083
  - finishedAt 2026-03-14T11:08:08.125Z (UTC)
- `qa:parity` PASS (72/72)
  - report: `docs/MAP_SEARCH_PARITY_REPORT_2026-03-14.md`
  - data: `docs/MAP_SEARCH_PARITY_REPORT_2026-03-14.json`
  - note: report filename is UTC date

## 19) Docs/Notes updated
- `docs/SEOUL_COVERAGE_PRIORITY_2026-03-10.md`
  - 11305 moved to 완료(12개월 커버)
- `docs/PHASE3_EXECUTION_LOG.md`
  - Added 2026-03-14 execution logs (11305 backfill + post-gate/parity)

## 20) Geumcheon (`11545`) Gap Backfill (Complete)
- Method: monthly ingest + `db:normalize` after each month
- Executed:
  - 202503: fetched 98, raw inserted 90, norm inserted 95
  - 202504: fetched 63, raw inserted 57, norm inserted 59
  - 202505: fetched 78, raw inserted 71, norm inserted 73
  - 202506: fetched 141, raw inserted 130, norm inserted 136
  - 202507: fetched 63, raw inserted 58, norm inserted 60
  - 202508: fetched 74, raw inserted 68, norm inserted 70
  - 202509: fetched 85, raw inserted 83, norm inserted 84
  - 202510: fetched 95, raw inserted 95, norm inserted 95
  - 202511: fetched 53, raw inserted 52, norm inserted 53
  - 202512: fetched 83, raw inserted 81, norm inserted 82
  - 202601: fetched 118, raw inserted 1, norm inserted 32
  - 202602: fetched 93, raw inserted 24, norm inserted 47
- Status: done (202503~202602, 12/12)

## 21) Post-11545 geocode/parity
- `geocode:maintain` strict PASS
  - total 8042, exact 6468, approx 1574, pending 1284, failed 66, permanentFailed 224
  - exactRatio 0.8043, failRatio 0.0082
  - finishedAt 2026-03-14T11:31:53.187Z (UTC)
- `qa:parity` PASS (72/72)
  - report: `docs/MAP_SEARCH_PARITY_REPORT_2026-03-14.md`
  - data: `docs/MAP_SEARCH_PARITY_REPORT_2026-03-14.json`
  - note: report filename is UTC date

## 22) Docs/Notes updated
- `docs/SEOUL_COVERAGE_PRIORITY_2026-03-10.md`
  - 11545 moved to 완료(12개월 커버)
- `docs/PHASE3_EXECUTION_LOG.md`
  - Added 2026-03-14 execution logs (11545 backfill + post-gate/parity)

## 23) Conversation Saved
- Requested to save conversation as md under `C:\Users\Sam\Desktop\budongsan-v2\notes`
- Updated this log file accordingly

## 24) Junggu (`11140`) Gap Backfill (Complete)
- Method: monthly ingest + `db:normalize` after each month
- Executed:
  - 202503: fetched 178, raw inserted 159, norm inserted 159
  - 202504: fetched 109, raw inserted 94, norm inserted 98
  - 202505: fetched 127, raw inserted 114, norm inserted 116
  - 202506: fetched 216, raw inserted 191, norm inserted 198
  - 202507: fetched 56, raw inserted 48, norm inserted 48
  - 202508: fetched 71, raw inserted 63, norm inserted 67
  - 202509: fetched 162, raw inserted 155, norm inserted 156
  - 202510: fetched 146, raw inserted 110, norm inserted 119
  - 202511: fetched 34, raw inserted 32, norm inserted 32
  - 202512: fetched 78, raw inserted 75, norm inserted 75
  - 202601: fetched 77, raw inserted 6, norm inserted 21
  - 202602: fetched 45, raw inserted 17, norm inserted 20
- Status: done (202503~202602, 12/12)

## 25) Post-11140 geocode/parity
- `geocode:maintain` strict PASS
  - total 8100, exact 6515, approx 1585, pending 1289, failed 67, permanentFailed 224
  - exactRatio 0.8043, failRatio 0.0083
  - finishedAt 2026-03-14T12:13:59.673Z (UTC)
- `qa:parity` PASS (72/72)
  - report: `docs/MAP_SEARCH_PARITY_REPORT_2026-03-14.md`
  - data: `docs/MAP_SEARCH_PARITY_REPORT_2026-03-14.json`
  - note: report filename is UTC date

## 26) Docs/Notes updated
- `docs/SEOUL_COVERAGE_PRIORITY_2026-03-10.md`
  - 11140 moved to completed list (12-month coverage)
- `docs/PHASE3_EXECUTION_LOG.md`
  - Added 2026-03-14 execution logs (11140 backfill + post-gate/parity)

## 27) Jongno (`11110`) Gap Backfill (Complete)
- Method: monthly ingest + `db:normalize` after each month
- Executed:
  - 202503: fetched 90, raw inserted 81, norm inserted 88
  - 202504: fetched 43, raw inserted 41, norm inserted 41
  - 202505: fetched 61, raw inserted 58, norm inserted 60
  - 202506: fetched 107, raw inserted 99, norm inserted 103
  - 202507: fetched 40, raw inserted 35, norm inserted 37
  - 202508: fetched 42, raw inserted 41, norm inserted 42
  - 202509: fetched 67, raw inserted 65, norm inserted 66
  - 202510: fetched 88, raw inserted 85, norm inserted 86
  - 202511: fetched 22, raw inserted 22, norm inserted 22
  - 202512: fetched 43, raw inserted 43, norm inserted 43
  - 202601: fetched 46, raw inserted 1, norm inserted 14
  - 202602: fetched 44, raw inserted 15, norm inserted 25
- Status: done (202503~202602, 12/12)

## 28) Post-11110 geocode/parity
- `geocode:maintain` strict PASS
  - total 8146, exact 6563, approx 1583, pending 1290, failed 69, permanentFailed 224
  - exactRatio 0.8057, failRatio 0.0085
  - finishedAt 2026-03-14T13:10:42.390Z (UTC)
- `qa:parity` PASS (72/72)
  - report: `docs/MAP_SEARCH_PARITY_REPORT_2026-03-14.md`
  - data: `docs/MAP_SEARCH_PARITY_REPORT_2026-03-14.json`
  - note: report filename is UTC date

## 29) Docs/Notes updated
- `docs/SEOUL_COVERAGE_PRIORITY_2026-03-10.md`
  - 11110 moved to completed list (12-month coverage)
- `docs/PHASE3_EXECUTION_LOG.md`
  - Added 2026-03-14 execution logs (11110 backfill + post-gate/parity)
