# ROADMAP_TOPTIER_MAPPING

- Updated: 2026-03-08
- Source API: MOLIT apartment trade (`RTMSDataSvcAptTradeDev`)
- Regions scanned: Songpa (`11710`), Gangdong (`11740`)
- Period scanned: `202401` to `202602`

## Target Mapping Table
| Product target label | API exact aptNm found | Evidence in API | Mapping status | Included in current DB snapshot |
|---|---|---|---|---|
| Olympic Park Foreon | Yes | `aptNm=olympic-park-foreon` equivalent found in Gangdong/Dunchon; first `202412`, last `202510`, count `13` | Exact source name exists; backfill months must include `202412~202510` | Not confirmed yet |
| Jamsil Le-El | No | No aptNm match for `jamsil + le-el` tokens in Songpa/Gangdong scan | Likely source naming mismatch or no published trade records in scanned period | No |
| Jamsil Raemian I-Park | No | No aptNm match for `jamsil + raemian + ipark` tokens in Songpa/Gangdong scan | Likely source naming mismatch or no published trade records in scanned period | No |

## Supporting Signals From Source aptNm

### Songpa (`11710`) notable names
- `Lecents`: count 417 (`202401~202602`)
- `Jamsil Els`: count 349 (`202401~202602`)
- `Jugong Apt 5`: count 299 (`202401~202602`)
- `Trizium`: count 270 (`202402~202602`)
- `Lake Palace`: count 180 (`202401~202601`)

### Gangdong (`11740`) notable names
- `Dunchon Prugio`: count 132 (`202401~202602`)
- `Sinsung Dunchon Misojium 1`: count 88 (`202402~202601`)
- `Sinsung Dunchon Misojium 2`: count 46 (`202403~202601`)
- `The Sharp Dunchon Fore`: count 30 (`202407~202510`)
- `Olympic Park Foreon`: count 13 (`202412~202510`)

## Why the target can be missing in DB even if found in API
1. Recent-month-only backfill (for example `202602`) misses targets whose latest records are in older months.
2. Product/marketing names can differ from source `aptNm`.
3. Current pipeline ingests apartment sale only (no jeonse/wolse ingestion yet).

## Next action for this target set
1. Run targeted backfill for Songpa/Gangdong months `202412~202510`.
2. Run normalize and re-check exact `aptNm` presence in DB.
3. Keep an alias dictionary only when source name is consistently different from product label.
