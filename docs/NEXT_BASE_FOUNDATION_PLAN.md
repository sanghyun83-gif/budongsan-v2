# NEXT_BASE_FOUNDATION_PLAN

- 작성일: 2026-03-03
- 목적: Top-tier 품질로 가기 위한 기반 작업 우선순위 고정
- 원칙: UI 확장보다 Coverage/Accuracy/Freshness/Reliability를 먼저 완성

## 1. 결론 (우선순위)
`Coverage -> Accuracy -> Freshness -> Reliability -> UX`

Top-tier 부동산 서비스는 메인 UI보다 먼저 데이터 기반 체계를 고정한다.

## 2. P0 (지금 바로)

### 2.1 데이터 커버리지 확장
- 범위: 서울 전 구 + 최근 6~12개월
- 실행: `npm run ingest:molit -- --regions=<codes> --months=6 --maxPerRegion=12000`
- 완료 조건:
  - 검색 0건 비율 감소
  - 주요 키워드(예: 래미안, 자이, 힐스테이트) 검색 시 지역별 결과 확보

### 2.2 좌표 정확도 유지 자동화
- 실행: `npm run geocode:maintain`
- cron: 하루 1회 유지 실행
- 게이트:
  - `exactRatio >= 0.80`
  - `failRatio <= 0.05`

### 2.3 최신성(Freshness) 고정
- ingest + normalize 일일 자동화
- 모니터링: `/api/ops/data-freshness`
- 완료 조건:
  - 마지막 적재 시각 24시간 이내
  - 정규화 실패 누적 없음

### 2.4 검색 신뢰성 고정
- map/search 파라미터 정합성 유지
- 가격/정렬/bbox 경계값 검증 유지
- 완료 조건:
  - 동일 조건에서 map/list count 오차 허용 범위 내
  - 비정상 입력(초대형 price 등) 안전 처리

## 3. P1 (P0 이후)

### 3.1 품질 대시보드
- KPI: coverage, exactRatio, failRatio, freshness lag
- 운영자가 하루 1회 상태를 확인할 수 있게 단순화

### 3.2 실패 재시도 큐 고도화
- 일시 실패 vs 영구 실패 분리
- 재시도 정책(횟수/간격) 명시

### 3.3 성능 안정화
- 고빈도 쿼리 인덱스 점검
- 목표 p95:
  - `/api/search` < 500ms
  - `/api/map/complexes` < 500ms

## 4. Top-tier 관점에서의 판단
- 지금 단계에서 가장 큰 가치: 데이터 확장
- 이유: 유입 후 이탈의 1순위 원인은 "결과 없음/위치 불신"이지 UI 미려함이 아님
- 따라서 현재 전략은 적절하며, 기반 고정 후 UX 확장하는 것이 맞다.

## 5. 오늘 실행 체크리스트
1. 서울 전 구 ingest 배치 실행
2. normalize 실행 및 건수 확인
3. geocode maintain 실행
4. location gate 통과 확인
5. 주요 키워드 검색 샘플 20개 수동 검증
