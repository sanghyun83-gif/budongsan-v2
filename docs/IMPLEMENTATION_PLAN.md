# IMPLEMENTATION_PLAN (MVP-2)

- 버전: v1.1
- 작성일: 2026-02-28
- 갱신일: 2026-03-03
- 범위: Search + Map + Complex Detail + 최소 Ingestion + 운영 기초

## 1. 목표
MVP-1(DB 연결) 이후 실제 사용자 흐름(검색 → 지도/리스트 확인 → 단지 상세 진입)이 끊기지 않게 동작하는 MVP-2를 완성한다.

## 2. 성공 기준
1. 사용자 핵심 플로우가 데스크탑/모바일에서 모두 동작한다.
2. `/api/search`, `/api/map/complexes`, `/api/complexes/:id`, `/api/complexes/:id/deals`가 안정적으로 응답한다.
3. 데이터 신뢰성 표기(출처, 최종 업데이트 시각)가 홈/상세에 노출된다.
4. 빌드와 기본 품질 게이트(`lint/build`)가 통과한다.

## 3. 작업 스트림
### A. Frontend (P0)
1. 검색 UI(`q`, `region`, `min/max price`, `sort`) 유지
2. 지도/리스트 동기화 유지
3. 상세 페이지(`/complexes/[id]`) 안정화
4. CTA 버튼 + 이벤트 수집 연결

### B. API (P0)
1. `GET /api/complexes/:id`
2. `GET /api/complexes/:id/deals`
3. `/api/search` 정렬/필터/유효성 검증
4. `/api/map/complexes`와 검색 파라미터 정합성 유지

### C. Data Pipeline (P1)
1. MOLIT ingest 스크립트 운영
2. `raw -> normalized` 정규화 루틴 유지
3. 중복 적재 방지(idempotent) 규칙 유지
4. 일일 cron 기반 정규화 자동화

### D. 운영/관측성 (P0)
1. API 에러 포맷 통일
2. 구조화 로그 + p50/p95 지표 기록
3. 배포 후 스모크 테스트 루틴 문서화
4. 장애 대응 Runbook 유지

## 4. 일정(2주 기준)
### Week 1
1. 검색/지도/상세 핵심 API 안정화
2. 화면 예외 처리(빈 결과/에러/로딩) 보강
3. 데이터 최신성 및 신뢰 라벨 점검

### Week 2
1. ingest/정규화 자동화 점검
2. p95 지표 점검 및 인덱스 최적화
3. 런칭 게이트 체크리스트 완료
4. Vercel Production 최종 회귀 테스트

## 5. 의존성
1. `DATABASE_URL` (local + Vercel)
2. `NEXT_PUBLIC_KAKAO_JS_KEY`
3. `DATA_GO_KR_API_KEY`
4. `CRON_SECRET`

## 6. 완료 정의 (Definition of Done)
1. Local + Vercel에서 핵심 API 4종 정상 동작
2. 검색/지도/상세 플로우 회귀 테스트 통과
3. 일일 정규화 cron 수동 트리거 성공
4. `npm run build` 성공
5. 런칭 체크리스트 기준 `No-Go` 항목 없음
