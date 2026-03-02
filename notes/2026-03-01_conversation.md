# Conversation Notes (2026-03-01)

## 목표
- `budongsan-v2`를 MVP 기준으로 빠르게 런칭 가능한 상태로 고도화.
- 카카오 지도 + 공공데이터(국토부 실거래) 연동 기반에서 검색/지도/상세 흐름 안정화.

## 오늘 핵심 진행 내용
- Vercel, Neon, 환경변수(`DATABASE_URL`, `CRON_SECRET`) 설정 및 점검 진행.
- DB 마이그레이션/시드/정규화 흐름 정리:
  - `sql/001_init.sql`
  - `sql/002_seed.sql`
  - `sql/003_normalize_from_raw.sql`
- API/화면 검증:
  - `/api/search`
  - `/api/map/complexes`
  - `/api/complexes/:id`
  - `/api/complexes/:id/deals`
- 에러/품질 이슈 대응:
  - Hydration mismatch(시간 문자열 렌더 차이) 이슈 확인/보완.
  - `exact_only` boolean 파싱 버그(문자열 `false`가 true로 해석) 수정.
- 문서 체계 확장:
  - `docs/IMPLEMENTATION_PLAN.md`
  - `docs/LAUNCH_MINIMUM_CHECKLIST.md`
  - `docs/NEXT_PHASE_MVP3_PLAN.md`
  - `docs/PHASE3_EXECUTION_LOG.md`
  - `docs/LOCATION_ACCURACY_PHASE_PLAN.md`

## 주요 진단 결론
- “리스트-맵 싱크 로직” 자체보다, **좌표 품질**이 현재 체감 문제의 핵심.
- 현재 다수 데이터가 `approx`(근사 좌표)라 주소/포인트 체감 불일치가 발생.
- 초기 소량 데이터 시기보다 대량 적재 이후 mismatch 체감이 커진 원인도 동일.

## 합의된 우선순위
1. 위치 정확도 개선(데이터 파이프라인)
2. 정렬/랭킹 + 탐색 UX 안정화
3. 성능/인덱스 최적화
4. 운영 자동화/런칭 게이트 완료

## 다음 작업(Next)
- 지오코딩 백필 파이프라인으로 `approx -> exact` 전환율 향상.
- `exact ratio` KPI 운영(예: 80% 이상 목표).
- 프로덕션 점검 루틴 고정:
  - cron normalize 200
  - data freshness 확인
  - 검색→지도→상세 회귀 테스트(모바일/데스크탑)

## 메모
- 사용자 요청: 문서는 한글 우선, 기술 키워드만 영문 혼용.
- 사용자 요청: “근사 위치” 뱃지보다 근본 원인(좌표 정확도) 해결 우선.
