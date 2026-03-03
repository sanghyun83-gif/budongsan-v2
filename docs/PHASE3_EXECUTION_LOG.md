# PHASE3_EXECUTION_LOG

- 시작일: 2026-03-01
- 단계 목표: MVP-3 (정렬/검색 품질 + 성능/인덱스 + 운영 안정화 + 데이터 커버리지 확장)
- 최종 갱신: 2026-03-03

## Step 2. 정렬/검색/UI

### 구현
1. `GET /api/search`
- `sort=latest|price_desc|price_asc|deal_count` 지원
- 응답에 `appliedSort`, `totalCount`, `updatedAt` 포함

2. `GET /api/map/complexes`
- `search`와 동일 정렬 규칙 적용
- 응답에 `appliedSort` 포함

3. `components/Explorer.tsx`
- 정렬 드롭다운 추가
- 검색-지도-리스트 동기화 유지
- 0건 상태 액션(빠른 적용 버튼) 보강
- 시간 포맷(KST) 고정으로 hydration mismatch 완화

### 검증
- `npm run lint` 통과
- `npm run build` 통과
- `/api/search?...&sort=price_desc` 정상 응답
- `/api/map/complexes?...&sort=deal_count` 정상 응답

## Step 3. 성능/인덱스

### 구현
1. `sql/004_mvp3_indexes.sql`
- `pg_trgm` extension
- `complex.apt_name`, `complex.legal_dong` trigram index
- `complex(region_id, updated_at)` index
- `deal_trade_normalized` 복합 index 2종
- `deal_trade_raw(ingested_at)` index

2. `package.json`
- `npm run db:indexes:mvp3` 스크립트 연결

### 검증
- `npm run db:indexes:mvp3` 실행 완료 (`Applied SQL` 확인)

## Step 4. 운영 안정화

### 구현
1. `GET /api/cron/normalize`
- `x-cron-secret` 또는 `Authorization: Bearer` 인증
- 성공/실패 이벤트 `audit_log` 기록

2. `GET /api/ops/data-freshness`
- 최근 24시간 raw/normalized 집계
- 최근 cron 실행 이력 조회

3. 런칭 게이트 스모크
- `npm run qa:smoke`
- 보고서: `docs/LAUNCH_GATE_REPORT_2026-03-01.md`

## 2026-03-01 (Location Accuracy P0)
- `sql/005_location_source.sql` 추가/적용 (`complex.location_source`: exact/approx)
- `package.json` 스크립트 추가: `db:location-source`
- API 반영:
  - `/api/search` 응답에 `location_source`
  - `/api/map/complexes` 응답에 `locationSource`
  - `/api/complexes/:id` 응답에 `locationSource`
- UI 반영:
  - 리스트/상세에 `근사 위치` 표시
- 검증:
  - `npm run lint` 통과
  - `npm run build` 통과

## 2026-03-03 실행 로그 (Data Coverage + Geocode Maintain)

### A. 1차 커버리지 확장
1. `npm run ingest:molit:dry` 성공
2. 핵심 5개 구 적재(단일 배치, 3개월)
- 11680(강남): fetched 261, norm inserted 42
- 11650(서초): fetched 184, norm inserted 24
- 11710(송파): fetched 451, norm inserted 62
- 11440(마포): fetched 219, norm inserted 40
- 11200(성동): fetched 184, norm inserted 27
3. `npm run db:normalize` 성공
4. `npm run qa:parity` PASS
- `docs/MAP_SEARCH_PARITY_REPORT_2026-03-03.md`
- `docs/MAP_SEARCH_PARITY_REPORT_2026-03-03.json`

### B. 우선순위 분할 적재(추가)
- 11470(양천): fetched 400, norm inserted 33
- 11350(노원): fetched 410, norm inserted 90
- 11740(강동): fetched 364, norm inserted 39
- 11500(강서): fetched 460, raw inserted 452, norm inserted 453
- 11560(영등포): fetched 414, raw inserted 26, norm inserted 62

### C. Geocode Maintain 병행
1차 실행 결과:
- exactRatio: 0.6703
- failRatio: 0.0151
- 기준 미통과 (`exact >= 0.80`)

2차 실행 결과:
- exactRatio: 0.7774
- failRatio: 0.0146
- 기준 근접

3차 실행 결과(추가 실행):
- exactRatio: 0.8123
- failRatio: 0.0108
- 기준 통과 (`exact >= 0.80`, `fail <= 0.05`)

### D. 현재 상태 요약
- total complex: 2120
- exact: 1722
- approx: 398
- pending: 322
- failed: 23
- permanentFailed: 53
- 게이트: 통과

## 다음 액션
1. 서울 나머지 구 분할 적재 계속
2. 배치마다 `geocode:maintain` 병행
3. 하루 종료 시점에 gate 수치 기록 및 로그 갱신

## 2026-03-04 실행 로그 (추가 커버리지 + geocode 병행)

### A. 우선순위 추가 분할 적재
- 11620(관악, 3개월): fetched 338, norm inserted 14
- 11590(동작, 3개월): fetched 262, raw inserted 6, norm inserted 99
- 11380(은평, 3개월): fetched 469, raw inserted 464, norm inserted 464
- 11530(구로, 2개월): fetched 184, norm inserted 34
- 11215(광진, 3개월): fetched 106, raw inserted 104, norm inserted 104

### B. 정규화
- `npm run db:normalize` 실행 완료

### C. geocode:maintain 병행 결과
1차(추가 커버리지 직후):
- total: 2466
- exactRatio: 0.7826
- failRatio: 0.0142
- 상태: 미통과(0.80 직전)

2차(추가 1회 실행):
- total: 2466
- exact: 1986
- approx: 480
- pending: 386
- failed: 31
- permanentFailed: 63
- exactRatio: 0.8054
- failRatio: 0.0126
- 상태: 게이트 통과 (`exact >= 0.80`, `fail <= 0.05`)

### D. 누적 요약(현재)
- total complex: 2466
- 위치 정확도 게이트: 통과
- 운영 원칙: 커버리지 배치 1~2회마다 geocode:maintain 병행
