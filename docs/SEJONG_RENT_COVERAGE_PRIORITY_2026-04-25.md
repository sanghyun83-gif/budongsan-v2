# SEJONG_RENT_COVERAGE_PRIORITY_2026-04-25

- 기준 범위: 202601~202604 (2026-01-01 ~ 2026-04-25)
- 대상: 세종 36xxx 전세·월세(아파트 전월세)
- 상태: 전월세 API 검증 완료 / 지역 ingest+normalize 완료

## Priority (rent missing 4개월 그룹)
None

## 작업 로그
- 2026-04-25
  - 세종 전세/월세 전용 커버리지 문서 생성
  - 전월세 ingest/normalize: 미적용
- 2026-04-26
  - 세종 1개시 전월세 적재 실행 (202601~202604)
  - API 조회: `5,146건`
  - DB 적재: `raw 4,872건 / normalized 4,872건`
