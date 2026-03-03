# DATA_COVERAGE_IMPLEMENTATION_PLAN

- 작성일: 2026-03-03
- 범위: `NEXT_BASE_FOUNDATION_PLAN.md` 2.1 데이터 커버리지 확장
- 목표: 서울 전 구 + 최근 6~12개월 데이터 적재로 검색 0건 비율 감소

## 1) 목표 지표 (KPI)
1. Coverage
- 서울 25개 구 모두 `complex` 데이터 존재
- 주요 브랜드 키워드(`래미안`, `자이`, `힐스테이트`) 검색 시 다수 구에서 결과 노출

2. Search Outcome
- 테스트 키워드 20개 기준 0건 응답 비율 감소

3. Data Freshness
- 적재 후 `raw -> normalized` 정상 반영

## 2) 실행 전략
1. 배치를 한 번에 크게 돌리지 않고 권역 단위로 분할 실행
2. 각 배치마다 ingest -> normalize -> 샘플 검증 순서 고정
3. 실패 배치는 같은 파라미터로 재시도, 재시도 2회 후 로그 분석

## 3) 실행 단계 (Step-by-step)
### Step A. 사전 점검
```bash
npm run ingest:molit:dry
```
확인:
- API key / DB 연결 오류 없음

### Step B. 1차 적재 (핵심 권역)
```bash
npm run ingest:molit -- --regions=11680,11650,11710,11440,11200 --months=6 --maxPerRegion=12000
```

### Step C. 2차 적재 (서울 나머지)
`regions`를 나눠 2~3회로 실행:
```bash
npm run ingest:molit -- --regions=<남은_구코드_CSV> --months=6 --maxPerRegion=12000
```

### Step D. 정규화 실행
```bash
npm run db:normalize
```

### Step E. 품질 확인
```bash
npm run ops:location-gate
```
추가 확인:
- `/api/search?q=래미안&page=1&size=20`
- `/api/search?q=자이&page=1&size=20`
- `/api/search?q=힐스테이트&page=1&size=20`

## 4) 운영 기준
1. 타임아웃/429 발생 시
- `maxPerRegion` 감소(예: 12000 -> 8000)
- regions를 더 잘게 분할

2. 적재 실패 시
- 동일 명령 1회 재시도
- 반복 실패 시 해당 region만 분리 실행

3. 데이터 불일치 시
- normalize 재실행 후 재검증

## 5) 완료 정의 (Definition of Done)
1. 서울 전 구 적재 완료
2. 브랜드 키워드 3종 검색 결과 다구역 노출 확인
3. 0건 비율이 기존 대비 유의미하게 감소
4. 실행 로그/결과를 `docs/PHASE3_EXECUTION_LOG.md`에 기록

## 6) 권장 일정
- Day 1: Dry-run + 핵심 권역 적재 + normalize
- Day 2: 나머지 권역 적재 + 재시도 + 검증/로그 정리
