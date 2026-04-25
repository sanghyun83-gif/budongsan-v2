# 2026-04-25 Conversation Log

## 요청/진행 요약
- ingest/normalize 느린 원인 전수조사 및 제한 확인
  - ingest: `maxPerRegion` 컷 존재, 기본 fetch/page/DB write 병목 확인
  - normalize: 전수 스캔 + 중복체크 비용 이슈 확인
- 속도 최대화 작업 적용
  - `scripts/ingest-molit.mjs` 병렬/배치 옵션 및 bulk write 구조 반영
  - incremental normalize SQL/cron 구조 반영
  - 관련 SQL/문서/package 스크립트 업데이트

## 실행 작업(데이터 적재)
- 서울(25개구) `202601~202604` 적재 + normalize 완료
- 경기도(41xxx, 실행코드 47개) `202501~202604` 적재 + normalize 완료
- 부산(16개구/군) `202601~202604` 적재 + normalize 완료
- 대전(5개구) `202601~202604` 적재 + normalize 완료
- 대구/인천/광주/울산/세종 `202601~202604` 순차 적재 + normalize 완료

## 문서 작업
- 서울/경기/부산/대전/대구/인천/광주/울산/세종 커버리지 문서 생성/갱신
- 경기 문서를 시/군 통합코드 기준으로 재작성
- 대도시 통합 현황 문서 생성: `docs/METRO_COVERAGE_PRIORITY_2026-04-25.md`
- 월세 API 검증 문서 생성: `docs/APT_RENT_API_VERIFY_2026-04-25.md`

## 정리 작업
- 맵 관련 parity 리포트(.md/.json) 아카이브 이동
  - `docs/archive/map/`

## 참고
- 오늘 표준 노트 파일명 형식 유지: `YYYY-MM-DD-conversation.md`
