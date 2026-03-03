# DATA_COVERAGE_RUNBOOK (MVP-3 Day 1-2)

## 목적
서울 권역 중심으로 아파트/거래 데이터 커버리지를 확장해 검색 0건 비율을 낮춘다.

## 대상 스크립트
- `scripts/ingest-molit.mjs`

기능:
1. region 코드별 MOLIT 거래 데이터 수집
2. `region`, `complex` upsert
3. `deal_trade_raw` 적재
4. `deal_trade_normalized` 정규화 적재

## 사전 조건
1. `.env.local` 또는 환경변수에 `DATABASE_URL` 설정
2. `.env.local` 또는 환경변수에 `DATA_GO_KR_API_KEY` 설정
3. 스키마 적용 완료(`sql/001_init.sql`)

## 실행 명령
### 1) Dry-run (권장)
```bash
npm run ingest:molit:dry
```

### 2) 기본 실행 (서울 3개월)
```bash
npm run ingest:molit:seoul3m
```

### 3) 커스텀 실행
```bash
npm run ingest:molit -- --regions=11680,11650,11710 --months=6 --maxPerRegion=12000
```

옵션:
- `--regions`: 지역코드 CSV
- `--months`: 최근 N개월
- `--maxPerRegion`: 지역당 최대 적재 건수
- `--dryRun=true`: 저장 없이 수집량 점검

## 검증 SQL
```sql
-- 단지 수
SELECT COUNT(*) FROM complex;

-- 최근 3개월 지역별 거래 건수
SELECT r.code, r.name_ko, COUNT(*) AS deal_count
FROM deal_trade_normalized d
JOIN complex c ON c.id = d.complex_id
JOIN region r ON r.id = c.region_id
WHERE d.deal_date >= (CURRENT_DATE - INTERVAL '3 months')
GROUP BY r.code, r.name_ko
ORDER BY deal_count DESC;

-- 검색 키워드 샘플 점검
SELECT apt_name, legal_dong
FROM complex
WHERE apt_name ILIKE '%래미안%'
ORDER BY updated_at DESC
LIMIT 20;
```

## 운영 팁
- 대량 적재는 권역 분할 실행(예: 강남/송파/서초 순차)
- 타임아웃 발생 시 `--maxPerRegion`를 낮춰 재실행
- 적재 직후 `npm run db:normalize` 또는 cron normalize 결과 확인
