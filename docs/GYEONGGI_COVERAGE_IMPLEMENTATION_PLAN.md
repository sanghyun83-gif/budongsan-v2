# GYEONGGI_COVERAGE_IMPLEMENTATION_PLAN

- 작성일: 2026-03-05
- 목표: `total complex 3218 -> 4000+` 달성
- 전략: 경기 대도시 우선 확장(성남, 수원, 용인, 고양, 화성)

## 1. 배경
서울 전수 확장 완료 후, 다음 marginal utility가 가장 높은 구간은 경기 대도시다.
- 수요/거래량이 크고
- 브랜드/동 키워드 검색 결과 체감 개선이 빠르며
- 인덱싱 가능한 상세 URL 증가 효과가 큼

## 2. 목표 KPI
1. 커버리지
- `total complex >= 4000`

2. 품질 게이트
- `exactRatio >= 0.80`
- `failRatio <= 0.05`

3. 검색 성과
- 샘플 50키워드 기준 0건 비율 `<= 15%`
- `qa:parity` PASS 유지

## 3. 실행 우선순위
1. 성남시
2. 수원시
3. 용인시
4. 고양시
5. 화성시

## 4. 실행 방식
원칙:
- 한 번에 대량 배치 금지(타임아웃 회피)
- 도시 단위 -> 구/권역 단위로 분할
- 배치 1~2회마다 `normalize + geocode:maintain`

기본 커맨드 템플릿:
```bash
npm run ingest:molit -- --regions=<codes> --months=3 --maxPerRegion=3000
```
타임아웃 시:
```bash
npm run ingest:molit -- --regions=<codes> --months=2 --maxPerRegion=2500
```

후속:
```bash
npm run db:normalize
npm run geocode:maintain
npm run qa:parity
```

## 5. Day Plan
### Day 1
- 성남 + 수원 1차 배치
- normalize
- geocode:maintain 1~2회

### Day 2
- 용인 + 고양 1차 배치
- normalize
- geocode:maintain 1~2회

### Day 3
- 화성 배치 + 누락 리트라이
- normalize
- geocode:maintain
- parity + 50키워드 샘플 점검

## 6. 완료 정의(DoD)
1. `total complex >= 4000`
2. location gate 통과 유지
3. parity PASS
4. 실행 결과를 `docs/PHASE3_EXECUTION_LOG.md`에 일자별 기록

## 7. 리스크/대응
1. 타임아웃
- months/limit 축소, 단일 region 실행

2. exactRatio 하락
- 배치 직후 maintain 즉시 실행
- gate 미통과 시 유지 루프 반복

3. 인덱싱 지연
- sitemap은 일일 재제출 금지
- 2~3일 단위 점검
