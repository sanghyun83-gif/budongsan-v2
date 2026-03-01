# NEXT_PHASE_MVP3_PLAN

- 버전: v1.0
- 날짜: 2026-03-01
- 목표: "UI 고도화 전" 데이터 커버리지 + 검색 품질 + 운영 안정화 완성

## 1. 왜 MVP-3가 필요한가
현재 병목은 UI가 아니라 데이터와 검색 품질이다.
- 데이터 부족: 결과 0건 빈도가 높음
- 검색 품질 미흡: 정렬/랭킹 체계 부재
- 운영 관측 부족: 데이터 최신성/실패 대응 체계 약함

즉, Top-tier 모방 우선순위는 "겉 UI"가 아니라 "데이터-검색-신뢰 체계"다.

## 2. MVP-3 핵심 목표
1. 데이터 커버리지 확장(최우선)
2. 검색 정렬/랭킹 도입
3. API 성능 최적화(p95)
4. 홈 UX 최소 개선(0건 대응)
5. 운영 자동화/모니터링 보강

## 3. 작업 범위

### A. Data Coverage (P0)
1. 서울 주요 권역 단지/거래 데이터 대량 적재
2. `deal_trade_raw -> deal_trade_normalized` 일일 누적 안정화
3. 데이터 최신성 메타 생성(`updated_at`, `source`, `count`)

완료 기준:
- 서울 핵심 구 검색 시 0건 비율 대폭 감소
- 주요 검색어(래미안/자이/푸르지오 등) 결과 정상 노출

### B. Search Quality (P0)
1. `/api/search` 정렬 파라미터 추가
- `sort=latest`
- `sort=price_desc`
- `sort=price_asc`
- `sort=deal_count`
2. 지도/리스트 동일 정렬 규칙 적용
3. 검색어 일치도 + 최근성 기반 랭킹 보강(단계적)

완료 기준:
- 동일 조건에서 정렬 결과 일관성 보장
- 사용자가 정렬 의도를 예측 가능

### C. Performance & Index (P1)
1. DB 인덱스 점검(PostgreSQL + PostGIS)
2. 자주 쓰는 조건 기반 쿼리 최적화
3. p95 측정 자동 로그 점검

목표:
- map API p95 < 500ms
- search API p95 < 700ms

### D. Home UX Minimum (P1)
1. 기본 검색어 자동 입력 제거(초기 빈 상태 명확화)
2. 0건 상태에 추천 액션 추가
- 조건 초기화
- 추천 지역 버튼
3. 결과 수/업데이트 시간 노출 유지

### E. Operations (P1)
1. cron 실행 성공/실패 로그 점검 루틴
2. 장애 대응 Runbook 보강
3. Launch gate 회귀 테스트 주기화

## 4. 1주 실행 계획

### Day 1-2
- 데이터 대량 적재(서울권)
- seed/ingest 검증

### Day 3
- `/api/search` sort 파라미터 구현
- 리스트 정렬 UI 연결

### Day 4
- 지도 결과 정렬 동기화
- 랭킹 기본 규칙 반영

### Day 5
- 인덱스/쿼리 튜닝
- p95 측정 및 기록

### Day 6-7
- 홈 0건 UX 개선
- 회귀 테스트 + Lighthouse 재실행

## 5. 리스크와 대응
1. 데이터 품질 불균일
- 대응: raw 보존 + normalized 검증 쿼리 운영
2. 쿼리 속도 저하
- 대응: 인덱스 + LIMIT + bbox 우선 필터
3. 운영 누락(cron 실패)
- 대응: 주간 점검 체크리스트 + 수동 fallback

## 6. 산출물(완료 시)
1. `sql/` 인덱스/마이그레이션 추가본
2. `/api/search` 정렬 지원
3. 홈 정렬 UI 및 0건 UX 개선
4. 성능/회귀 리포트
5. 문서 업데이트
- `docs/LAUNCH_MINIMUM_CHECKLIST.md`
- `docs/PHASE2_EXECUTION_LOG.md`
- `docs/DAILY_NORMALIZE_RUNBOOK.md`

## 7. Go/No-Go (MVP-3)
- Go:
  - 검색 주요 케이스 결과 정상 노출
  - sort 동작 일관성 확보
  - p95 목표 근접 또는 달성
  - cron 안정 동작
- No-Go:
  - 주요 검색어 반복 0건
  - 정렬 불일치
  - API 지연 급증/오류 증가
