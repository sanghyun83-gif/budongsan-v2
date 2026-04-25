# NATIONAL_ROWHOUSE_SALE_COVERAGE_PRIORITY_2026-04-26

- 기준 범위: 202601~202604 (2026-01-01 ~ 2026-04-26)
- 대상: 전국 우선권역 9개 (서울/경기/부산/대구/인천/광주/대전/울산/세종)
- 목적: 연립·다세대(빌라) 매매 커버리지를 전국 기준으로 통합 관리

## 통합 요약 (전국 · 연립·다세대 매매)
| 권역 | 코드 Prefix | 대상 지역 수 | API 호출 검증 | 연립다세대 매매 ingest | 연립다세대 매매 normalize | 상세 문서 |
|---|---|---:|---|---|---|---|
| 서울 | 11xxx | 25 | 완료(적재 실행 검증) | 완료(API 조회 12,044건) | 완료(DB raw/normalized 11,734건) | `docs/SEOUL_ROWHOUSE_SALE_COVERAGE_PRIORITY_2026-04-25.md` |
| 경기 | 41xxx | 31(통합코드) | 준비완료 | 미적용 | 미적용 | `docs/GYEONGGI_ROWHOUSE_SALE_COVERAGE_PRIORITY_2026-04-25.md` |
| 부산 | 26xxx | 16 | 완료(적재 실행 검증) | 완료(API 조회 1,453건) | 완료(DB raw/normalized 1,387건) | `docs/BUSAN_ROWHOUSE_SALE_COVERAGE_PRIORITY_2026-04-25.md` |
| 대구 | 27xxx | 9 | 완료(적재 실행 검증) | 완료(API 조회 325건) | 완료(DB raw/normalized 323건) | `docs/DAEGU_ROWHOUSE_SALE_COVERAGE_PRIORITY_2026-04-25.md` |
| 인천 | 28xxx | 10 | 완료(적재 실행 검증) | 완료(API 조회 3,148건) | 완료(DB raw/normalized 3,090건) | `docs/INCHEON_ROWHOUSE_SALE_COVERAGE_PRIORITY_2026-04-25.md` |
| 광주 | 29xxx | 5 | 완료(적재 실행 검증) | 완료(API 조회 188건) | 완료(DB raw/normalized 129건) | `docs/GWANGJU_ROWHOUSE_SALE_COVERAGE_PRIORITY_2026-04-25.md` |
| 대전 | 30xxx | 5 | 완료(적재 실행 검증) | 완료(API 조회 429건) | 완료(DB raw/normalized 423건) | `docs/DAEJEON_ROWHOUSE_SALE_COVERAGE_PRIORITY_2026-04-25.md` |
| 울산 | 31xxx | 5 | 완료(적재 실행 검증) | 완료(API 조회 280건) | 완료(DB raw/normalized 269건) | `docs/ULSAN_ROWHOUSE_SALE_COVERAGE_PRIORITY_2026-04-25.md` |
| 세종 | 36xxx | 1 | 완료(적재 실행 검증) | 완료(API 조회 51건) | 완료(DB raw/normalized 35건) | `docs/SEJONG_ROWHOUSE_SALE_COVERAGE_PRIORITY_2026-04-25.md` |

## 작업 로그
- 2026-04-26
  - 스키마 적용: `sql/011_rowhouse_trade_schema.sql`
  - 서울 파일럿(11110) + UI 조합 검증 완료
  - 서울/부산/대구/인천/광주/대전/울산/세종 순차 적재 완료

## 다음 작업
1. 경기 41xxx 연립·다세대 매매 ingest/normalize 실행
2. UI 회귀 테스트 자동화(탭/기간/평형/토글)
