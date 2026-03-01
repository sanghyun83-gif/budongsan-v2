# 데이터 커버리지 확장 Runbook (MVP-3 Day 1-2)

## 목적
서울 핵심 권역의 단지/거래 데이터를 `MOLIT API`에서 대량 수집해 검색 결과 커버리지를 확장한다.

## 신규 스크립트
- `scripts/ingest-molit.mjs`

기능:
1. region별 월별 실거래 수집(`MOLIT API`)
2. `region`, `complex` upsert
3. `deal_trade_raw` 적재
4. `deal_trade_normalized` 중복 방지 적재

## 사전 조건
1. `.env.local` 또는 환경변수에 `DATABASE_URL` 설정
2. `.env.local` 또는 환경변수에 `DATA_GO_KR_API_KEY` 설정
3. DB 스키마 적용(`sql/001_init.sql`)

## 실행 명령

### 1) Dry-run (권장)
```bash
npm run ingest:molit:dry
```

### 2) 기본 실행 (서울 핵심 3개월)
```bash
npm run ingest:molit:seoul3m
```

### 3) 커스텀 실행
```bash
npm run ingest:molit -- --regions=11680,11650,11710 --months=6 --maxPerRegion=12000
```

옵션:
- `--regions=...` : 지역코드 CSV
- `--months=3` : 최근 N개월
- `--maxPerRegion=8000` : 지역당 최대 적재 건수
- `--dryRun=true` : 적재 없이 수집/정규화 건수만 확인

## 검증 SQL

```sql
-- 단지 수
SELECT COUNT(*) FROM complex;

-- 지역별 최근 거래 건수
SELECT r.code, r.name_ko, COUNT(*) AS deal_count
FROM deal_trade_normalized d
JOIN complex c ON c.id = d.complex_id
JOIN region r ON r.id = c.region_id
WHERE d.deal_date >= (CURRENT_DATE - INTERVAL '3 months')
GROUP BY r.code, r.name_ko
ORDER BY deal_count DESC;

-- 검색 키워드 샘플 검증
SELECT apt_name, legal_dong
FROM complex
WHERE apt_name ILIKE '%래미안%'
ORDER BY updated_at DESC
LIMIT 20;
```

## 참고
- 현재 좌표는 geocoding 없이 region center + hash offset 방식으로 생성한다.
- 이후 Phase에서 주소 geocoding 파이프라인을 붙여 실제 좌표 정확도를 높인다.
