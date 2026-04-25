# ROWHOUSE_SALE_IMPLEMENTATION_PLAN_2026-04-26

목표: 연립·다세대 매매 전용 페이지를 아파트 `/complexes/[id]`와 동일한 UX(탭/기간/평형/URL 상태 유지)로 제공.

## 파일 단위 작업 순서 (아파트 구현 기준)

1. **스키마**
   - [x] `sql/011_rowhouse_trade_schema.sql`
   - 작업: `deal_rowhouse_trade_raw`, `deal_rowhouse_trade_normalized` 생성

2. **ingest 스크립트**
   - [x] `scripts/ingest-molit-rowhouse-trade.mjs`
   - 작업: MOLIT 연립다세대 매매 API(`RTMSDataSvcRHTrade/getRTMSDataSvcRHTrade`) 수집/정규화/벌크적재

3. **npm script 등록**
   - [x] `package.json`
   - 작업: `ingest:molit:rowhouse:sale`, `ingest:molit:rowhouse:sale:dry`

4. **조회 라이브러리 분리**
   - [x] `lib/rowhouses.ts`
   - 작업: summary/deals/trend 조회 함수 추가 (연립다세대 매매 테이블 기준)

5. **서브페이지 라우트 생성 (아파트 구조 복제)**
   - [x] `app/rowhouses/[id]/page.tsx`
   - 작업: `/complexes/[id]` 구조를 그대로 복제하여 `/rowhouses/[id]`에 적용

6. **API 라우트 생성**
   - [x] `app/api/rowhouses/[id]/route.ts`
   - 작업: 단건 summary 조회 API 추가

7. **후속 (실행/검증)**
   - [x] SQL 적용: `node scripts/run-sql.mjs sql/011_rowhouse_trade_schema.sql`
   - [x] 실데이터 ingest 파일럿: 서울 `11110`, `202604` (fetched 15 / raw 15 / normalized 15)
   - [x] `/rowhouses/[id]` 실데이터 화면 검증
     - 테스트 ID: `177587` (동남레저타운나동)
     - 조합 점검: `tab(price/listings/info) × trend(3m/6m/1y/all) × area(all/82.39)` = 24건 모두 `200`
     - UI 점검: 토글 active 정상, 매매 실데이터 노출, 전세/월세 빈데이터 문구 노출 정상
   - [ ] 필요 시 검색/링크 진입점 연결
