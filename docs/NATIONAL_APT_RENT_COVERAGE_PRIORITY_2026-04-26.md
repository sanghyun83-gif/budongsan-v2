# NATIONAL_APT_RENT_COVERAGE_PRIORITY_2026-04-26

- 기준 범위: 202601~202604 (2026-01-01 ~ 2026-04-26)
- 대상: 전국 우선권역 9개 (서울/경기/부산/대구/인천/광주/대전/울산/세종)
- 목적: 아파트 전세·월세 커버리지를 전국 기준으로 통합 관리

## API 검증 기준
- 서비스: `RTMSDataSvcAptRent`
- 정상 엔드포인트: `https://apis.data.go.kr/1613000/RTMSDataSvcAptRent/getRTMSDataSvcAptRent`
- 검증 문서: `docs/APT_RENT_API_VERIFY_2026-04-25.md`

## 통합 요약 (전국 · 아파트 전월세)
| 권역 | 코드 Prefix | 대상 지역 수 | API 호출 검증 | 전월세 ingest | 전월세 normalize | 상세 문서 |
|---|---|---:|---|---|---|---|
| 서울 | 11xxx | 25 | 완료 | 완료(API 조회 72,111건) | 완료(DB raw/normalized 68,302건) | `docs/SEOUL_RENT_COVERAGE_PRIORITY_2026-04-25.md` |
| 경기 | 41xxx | 31(통합코드, 실행 47코드) | 완료(엔드포인트 공통) | 진행중(13/47 코드 완료, DB raw 25,689건) | 진행중(13/47 코드 완료, DB normalized 25,689건) | 용량 제한으로 잔여 34코드 dry-run만 완료(추정 API 75,862건) |
| 부산 | 26xxx | 16 | 완료(엔드포인트 공통) | 완료(API 조회 17,912건) | 완료(DB raw/normalized 16,925건) | `docs/BUSAN_RENT_COVERAGE_PRIORITY_2026-04-25.md` |
| 대구 | 27xxx | 9 | 완료(엔드포인트 공통) | 완료(API 조회 10,699건) | 완료(DB raw/normalized 10,173건) | `docs/DAEGU_RENT_COVERAGE_PRIORITY_2026-04-25.md` |
| 인천 | 28xxx | 10 | 완료(엔드포인트 공통) | 완료(API 조회 20,425건) | 완료(DB raw/normalized 19,321건) | `docs/INCHEON_RENT_COVERAGE_PRIORITY_2026-04-25.md` |
| 광주 | 29xxx | 5 | 완료(엔드포인트 공통) | 완료(API 조회 7,254건) | 완료(DB raw/normalized 6,767건) | `docs/GWANGJU_RENT_COVERAGE_PRIORITY_2026-04-25.md` |
| 대전 | 30xxx | 5 | 완료(엔드포인트 공통) | 완료(API 조회 8,446건) | 완료(DB raw/normalized 7,710건) | `docs/DAEJEON_RENT_COVERAGE_PRIORITY_2026-04-25.md` |
| 울산 | 31xxx | 5 | 완료(엔드포인트 공통) | 완료(API 조회 3,835건) | 완료(DB raw/normalized 3,645건) | `docs/ULSAN_RENT_COVERAGE_PRIORITY_2026-04-25.md` |
| 세종 | 36xxx | 1 | 완료(엔드포인트 공통) | 완료(API 조회 5,146건) | 완료(DB raw/normalized 4,872건) | `docs/SEJONG_RENT_COVERAGE_PRIORITY_2026-04-25.md` |

## 작업 로그
- 2026-04-25: 서울 전월세 API 검증 + 스키마/ingest 적용 + 적재 완료
- 2026-04-26: 부산/대구/인천/광주/대전/울산/세종 전 지역 적재 완료
- 2026-04-26: 경기 41xxx 전월세 실행 시작
  - 실적재 완료: 13/47 실행코드 (`raw 25,689 / normalized 25,689`)
  - 잔여 34코드는 `dryRun` 완료 (`totalSeen 75,862`)
  - 중단 사유: DB 프로젝트 용량 제한(`project size limit 512 MB exceeded`)

## 다음 작업
1. DB 용량 증설 또는 보관정책 적용 후 경기 잔여 34코드 실적재 재실행
2. 경기 전월세 전용 커버리지 문서 분리 생성
