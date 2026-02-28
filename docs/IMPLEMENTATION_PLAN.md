# IMPLEMENTATION_PLAN (MVP-2)

- 버전: v1.0
- 날짜: 2026-02-28
- 범위: Search + Map + Complex Detail + 최소 Ingestion

## 1. 목표
MVP-1(DB 연결) 이후 실제 사용자 탐색 흐름이 동작하는 MVP-2를 완성한다.

## 2. 성공 기준
1. 사용자 검색 -> 지도/리스트 확인 -> 단지 상세 진입 가능
2. 단지 상세에서 최근 거래/핵심 지표 노출
3. 실거래 ingest 최소 자동화(수동 실행 + cron 준비)
4. 에러/로딩/빈상태 UX 보장

## 3. 작업 스트림

### A. Frontend (P0)
1. 검색 UI(`q`, `region`, `min/max price`)
2. 리스트 + 지도 동기화
3. 단지 상세 페이지(`/complexes/[id]`)
4. CTA 고정(관심등록 placeholder, 알림 placeholder)

### B. API (P0)
1. `GET /api/complexes/:id`
2. `GET /api/complexes/:id/deals`
3. `/api/search` 결과 스키마 확정
4. 지도 이동 시 재검색 API 호출 규칙 정리

### C. Data Pipeline (P1)
1. ingest script (`scripts/ingest-molit.mjs`)
2. `raw -> normalized` transform script
3. idempotent upsert 규칙
4. daily cron 설계 문서화

### D. 품질 (P0)
1. API error code 표준화
2. 로딩/빈상태/오류 상태 컴포넌트
3. p95 로그 측정(서버 로그 기반)
4. 스모크 테스트 루틴 문서화

## 4. 일정(2주)

### Week 1
1. Complex API 2종 구현
2. 상세 페이지 기본 UI
3. 검색+지도 필터 UX 완성
4. API/페이지 오류 상태 처리

### Week 2
1. ingest + transform script
2. seed 확장 및 검증
3. p95 측정/기록
4. Vercel 재배포 + 스모크 테스트

## 5. 의존성
1. `DATABASE_URL` 설정(local + Vercel)
2. `sql/001_init.sql` 적용
3. seed 데이터 준비(`sql/002_seed.sql`)

## 6. 완료 정의(Done Definition)
1. Local + Vercel에서 `/api/search`, `/api/map/complexes`, `/api/complexes/:id`, `/api/complexes/:id/deals` 정상 동작
2. 상세 페이지에서 최근 거래/요약 지표 표시
3. ingest script 1회 실행으로 데이터 반영
4. `lint/build` green

