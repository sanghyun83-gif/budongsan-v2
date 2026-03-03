# NEXT_PHASE_MVP3_PLAN

- 버전: v1.1
- 작성일: 2026-03-01
- 갱신일: 2026-03-03
- 목표: UI 확장 전에 데이터 커버리지 + 검색 품질 + 운영 안정성을 먼저 고정

## 1. 왜 MVP-3가 필요한가
현재 병목은 UI 부족보다 데이터/검색 품질 편차다.
- 특정 키워드에서 0건 비율이 높을 수 있음
- 정렬/필터 일관성 관리가 중요함
- 운영 관측(최신성/실패율) 자동 점검이 필요함

즉, Top-tier 방향은 "화려한 UI" 이전에 "데이터/검색/운영 체계"를 고정하는 것이다.

## 2. MVP-3 도달 목표
1. 데이터 커버리지 확장(P0)
2. 검색 정렬/필터 일관성 고정(P0)
3. API 성능 최적화(p95) (P1)
4. 운영 자동화/모니터링 고정(P1)

## 3. 작업 범위
### A. Data Coverage (P0)
1. 서울 핵심 권역 순차 ingest
2. raw/normalized 최신성 점검
3. 0건 키워드 목록 주기 점검

### B. Search Quality (P0)
1. `/api/search` 정렬 파라미터 유지
- `sort=latest`
- `sort=price_desc`
- `sort=price_asc`
- `sort=deal_count`
2. map/search 파라미터 정합성 유지
3. price 파라미터 범위 검증 유지

### C. Performance & Index (P1)
1. 빈도 높은 쿼리 인덱스 최적화
2. API p95 모니터링
- map p95 < 500ms 목표
- search p95 < 700ms 목표

### D. Operations (P1)
1. `/api/cron/normalize` 정상 실행 점검
2. `/api/ops/data-freshness`, `/api/ops/location-quality` 모니터링
3. 런칭 게이트 리포트 주기 업데이트

## 4. 1주 실행 계획
### Day 1-2
- 데이터 커버리지 확장 실행/검증

### Day 3
- 정렬/필터 품질 점검 및 회귀 테스트

### Day 4
- map/search 정합성 점검

### Day 5
- 성능/인덱스 점검, p95 기록

### Day 6-7
- 운영 점검 자동화 + 문서 업데이트

## 5. Go / No-Go
- Go:
  - 주요 키워드 검색 결과 안정
  - sort 동작 일관
  - API p95 목표 근접
  - cron/ops 점검 정상
- No-Go:
  - 반복 5xx
  - map/search 불일치 반복
  - 주요 키워드 0건 지속
