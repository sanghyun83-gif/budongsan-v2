# PHASE3_EXECUTION_LOG

- 시작일: 2026-03-01
- 단계 목표: MVP-3 (정렬/검색 품질 + 성능/인덱스 + 운영 안정화 + 데이터 커버리지 확장)
- 최종 갱신: 2026-03-17

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

## 2026-03-04 실행 로그 (서울 전수확장 1차)

### 완료된 구 적재
- 11110(종로, 3개월): fetched 74, raw inserted 72, norm inserted 73
- 11140(중구, 3개월): fetched 99, raw inserted 99, norm inserted 99
- 11170(용산, 3개월): fetched 121, raw inserted 116, norm inserted 116
- 11260(중랑, 3개월): fetched 305, raw inserted 301, norm inserted 302
- 11230(동대문, 2개월): fetched 149, norm inserted 24
  - 3개월 배치 타임아웃으로 2개월로 조정

### 상태
- 서울 미적재 구 중 1차 5개 처리 완료
- 2차 5개(성북/강북/도봉/서대문/금천)는 다음 실행으로 이월

## 2026-03-05 실행 로그 (서울 2차 완료 후 후속 작업)

### A. 정규화
- `npm run db:normalize` 실행 완료

### B. geocode:maintain 실행 결과
- 실행: `npm run geocode:maintain`
- 초기값:
  - total: 3218
  - exactRatio: 0.6172
  - failRatio: 0.0096
- 6라운드 종료값:
  - total: 3218
  - exact: 2239
  - approx: 979
  - pending: 869
  - failed: 37
  - permanentFailed: 73
  - exactRatio: 0.6958
  - failRatio: 0.0115
- 상태: failRatio 기준은 통과, exactRatio 기준(0.80)은 미통과

### C. 해석
- 서울 전수 확장으로 total이 크게 증가하면서 approx/pending이 동반 증가
- 현재는 geocode 유지 작업을 추가 반복해야 gate 재통과 가능

## 2026-03-05 실행 로그 (geocode:maintain 추가 반복)

### A. 1차 추가 실행
- 실행: `npm run geocode:maintain`
- 결과:
  - total: 3218
  - exact: 2423
  - approx: 795
  - pending: 679
  - failed: 40
  - permanentFailed: 76
  - exactRatio: 0.7530
  - failRatio: 0.0124
- 상태: failRatio는 통과, exactRatio는 미통과

### B. 2차 추가 실행
- 실행: `npm run geocode:maintain`
- 결과:
  - total: 3218
  - exact: 2599
  - approx: 619
  - pending: 495
  - failed: 32
  - permanentFailed: 92
  - exactRatio: 0.8076
  - failRatio: 0.0099
- 상태: 게이트 통과 (`exact >= 0.80`, `fail <= 0.05`)

## 2026-03-05 실행 로그 (경기 대도시 1차 확장 실행)

### A. 경기 코드별 적재 실행 결과
- 41465(용인 처인): months=2, fetched 441, norm inserted 266
- 41281(고양 덕양): months=2, fetched 332, norm inserted 119
- 41285(고양 일산동): months=2, fetched 125, norm inserted 35
- 41287(고양 일산서): months=2, fetched 171, norm inserted 56
- 41590(화성): months=2, fetched 0, norm inserted 0

참고(이전 실행 포함):
- 41461(용인 수지): months=2, fetched 197, norm inserted 146
- 41463(용인 기흥): months=1, fetched 23, norm inserted 13

### B. 정규화
- `npm run db:normalize` 실행 완료

### C. geocode maintain 실행 결과
1차 실행:
- total: 4526
- exact: 2897
- approx: 1629
- pending: 1195
- failed: 34
- permanentFailed: 92
- exactRatio: 0.6401
- failRatio: 0.0075
- 상태: failRatio 통과, exactRatio 미통과

2차 추가 실행:
- total: 4526
- exact: 3149
- approx: 1377
- pending: 927
- failed: 48
- permanentFailed: 94
- exactRatio: 0.6958
- failRatio: 0.0106
- 상태: failRatio 통과, exactRatio 미통과

### D. parity 점검
- `npm run qa:parity` 실행
- 결과: 1건 FAIL
  - `brand_prugio__seoul_wide__price_asc`
- 리포트 생성:
  - `docs/MAP_SEARCH_PARITY_REPORT_2026-03-05.md`
  - `docs/MAP_SEARCH_PARITY_REPORT_2026-03-05.json`

### E. 현재 기준 요약
- total complex: 4526 (목표 4000+ 달성)
- location gate: exactRatio 기준 미통과, failRatio 기준 통과
- 다음 우선 작업:
  1. `geocode:maintain` 반복 실행으로 exactRatio 회복
  2. parity FAIL 1건 원인 점검/수정

## 2026-03-05 실행 로그 (게이트 회복 추가 실행)

### A. geocode:maintain 추가 2회
1) 1회 추가 실행 결과:
- total: 4526
- exact: 3424
- approx: 1102
- pending: 715
- failed: 56
- permanentFailed: 94
- exactRatio: 0.7565
- failRatio: 0.0124
- 상태: 미통과 (exactRatio < 0.80)

2) 2회 추가 실행 결과:
- total: 4526
- exact: 3658
- approx: 868
- pending: 700
- failed: 62
- permanentFailed: 106
- exactRatio: 0.8082
- failRatio: 0.0137
- 상태: 게이트 통과 (`exact >= 0.80`, `fail <= 0.05`)

### B. parity 재검증
- `npm run qa:parity` 재실행
- 결과: 전체 PASS (이전 1건 FAIL 해소)
- 리포트 갱신:
  - `docs/MAP_SEARCH_PARITY_REPORT_2026-03-05.md`
  - `docs/MAP_SEARCH_PARITY_REPORT_2026-03-05.json`

### C. 현재 기준 상태
- total complex: 4526
- location gate: PASS
- map/search parity: PASS

## 2026-03-05 실행 로그 (경기 2차 확장 - 타임아웃 분할 실행)

### A. dry-run 점검
- `41590,41190,41170,41220,41360` (months=2)
  - 유효: 41220, 41360
  - 0건: 41590, 41190, 41170
- 세분화 dry-run (months=3)
  - 41192 fetched=644
  - 41194 fetched=368
  - 41196 fetched=91
  - 41171 fetched=576
  - 41173 fetched=592
  - 41590 fetched=0

### B. 실제 적재 (타임아웃 회피 분할)
- 41220(평택): months=3 타임아웃 -> months=1 재실행 성공
  - fetched 21, norm inserted 15
- 41360(남양주): months=2
  - fetched 576, raw inserted 569, norm inserted 572
- 41192(부천 원미): months=2
  - fetched 243, raw inserted 241, norm inserted 243
- 41194(부천 소사): months=2
  - fetched 138, raw inserted 137, norm inserted 137
- 41196(부천 오정): months=2
  - fetched 39, raw inserted 38, norm inserted 38
- 41171(안양 만안): months=2
  - fetched 227, raw inserted 215, norm inserted 219
- 41173(안양 동안): months=2
  - fetched 170, raw inserted 167, norm inserted 169

### C. 후속 실행
- `npm run db:normalize` 완료
- `npm run geocode:maintain` 1회 실행:
  - total: 5307
  - exact: 3936
  - approx: 1371
  - pending: 1209
  - failed: 56
  - permanentFailed: 106
  - exactRatio: 0.7417
  - failRatio: 0.0106
  - 상태: failRatio 통과, exactRatio 미통과
- `npm run qa:parity` 실행: 전체 PASS

### D. 현재 상태
- total complex: 5307
- coverage 목표(4000+): 달성 유지
- location gate: exactRatio 추가 회복 필요

## 2026-03-08 실행 로그 (화성 41590 월별 분할 점검)

### A. ingest 스크립트 개선 적용
- `scripts/ingest-molit.mjs`
  - 월 지정 옵션 추가: `--dealYmd=YYYYMM`
  - 기간 지정 옵션 추가: `--startYmd=YYYYMM --endYmd=YYYYMM`
  - 월별 fetch 로그 출력 추가

### B. 화성(41590) 실행 결과
1) 단일 월 dry-run
- 명령: `npm run ingest:molit -- --regions=41590 --dealYmd=202602 --dryRun=true`
- 결과: `month=202602 fetched=0`, `normalized=0`

2) 최근 12개월 월별 dry-run
- 명령: `npm run ingest:molit -- --regions=41590 --startYmd=202503 --endYmd=202602 --dryRun=true`
- 결과:
  - 202602~202503 전월 `fetched=0`
  - 합계 `fetched=0`, `normalized=0`

3) 실제 적재 + 정규화 실행
- 명령: `npm run ingest:molit -- --regions=41590 --dealYmd=202602 --maxPerRegion=5000`
  - 결과: `fetched=0`, `totalRawInserted=0`, `totalNormInserted=0`
- 명령: `npm run db:normalize`
  - 결과: `Applied SQL: sql/003_normalize_from_raw.sql`

### C. 판단
- 타임아웃 이슈는 월 분할로 우회 가능하게 준비되었지만,
- 화성(41590)은 최근 12개월 기준 API 응답 자체가 0건으로 확인됨.

### D. 다음 점검 항목
1. MOLIT 시군구 코드 매핑 재확인(화성 대응 코드/세분 코드 확인)
2. 화성 대체 코드 후보로 단월 dry-run 재검증
3. 코드 확인 전까지 coverage 집계에서 화성은 별도 이슈 트래킹 유지

## 2026-03-08 실행 로그 (화성 API 코드 전수 점검)

### A. 415xx 코드 스캔 결과 (MOLIT 직접 조회)
- 스캔 월: `202602`, `202512`, `202412`
- 공통 패턴:
  - `41590` = 0건
  - 비영(非0) 코드 = `41591`, `41593`, `41595`, `41597` (+ 타 시군 코드 일부)
- 샘플 검증:
  - `41597`: 청계동/목동/석우동(동탄권) 단지 다수
  - `41595`: 병점/진안/반월
  - `41591`: 향남/남양/새솔
  - `41593`: 봉담/정남/비봉

### B. 결론
- 화성은 기존 단일 코드 `41590`로는 수집되지 않고,
- 분할 코드 `41591,41593,41595,41597`로 조회해야 수집 가능.

### C. 코드 반영
- `scripts/ingest-molit.mjs`에 region alias 확장 추가:
  - `41590 -> 41591,41593,41595,41597`
  - `41190 -> 41192,41194,41196` (부천)
  - `41170 -> 41171,41173` (안양)
- 검증:
  - 명령: `npm run ingest:molit -- --regions=41590 --dealYmd=202602 --dryRun=true`
  - 결과: 자동 확장 후 합계 `fetched=1129`

## 2026-03-08 실행 로그 (화성 1개월+코드별 분할 실제 적재)

### A. 배치 전략 전환
- 배치 단위: `1개월 + 1코드`
- 이유: `41590` 통합 실행은 장시간 소요/타임아웃 리스크가 높음

### B. 202601 실제 적재 결과 (코드별)
- `41597`(동탄권): fetched 999, norm inserted 617
- `41595`(병점/진안권): fetched 243, norm inserted 123
- `41593`(봉담/정남권): fetched 134, norm inserted 109
- `41591`(향남/남양권): fetched 114, norm inserted 92

합계:
- fetched 1,490
- norm inserted 941

### C. 202602 참고 결과
- alias 적용 실행(`--regions=41590 --dealYmd=202602`) 결과:
  - fetched 1,129
  - norm inserted 744

### D. 후속
- `npm run db:normalize` 완료 (`Applied SQL: sql/003_normalize_from_raw.sql`)

## 2026-03-08 실행 로그 (화성 202512 + maintain/parity)

### A. 화성 202512 코드별 실제 적재
- `41597`: fetched 723, raw inserted 697, norm inserted 714
- `41595`: fetched 200, raw inserted 194, norm inserted 196
- `41593`: fetched 149, raw inserted 144, norm inserted 148
- `41591`: fetched 106, raw inserted 105, norm inserted 106

합계:
- fetched 1,178
- raw inserted 1,140
- norm inserted 1,164

### B. geocode:maintain 실행
- 명령: `npm run geocode:maintain`
- 최종 지표:
  - total: 5632
  - exact: 4156
  - approx: 1476
  - pending: 1268
  - failed: 96
  - permanentFailed: 112
  - exactRatio: 0.7379
  - failRatio: 0.0170
- 결과: strict FAIL (`exactRatio < 0.80`)

### C. parity 실행
- 명령: `npm run qa:parity`
- 결과: 1건 FAIL
  - `brand_hillstate__seoul_wide__price_asc`
- 리포트 생성:
  - `docs/MAP_SEARCH_PARITY_REPORT_2026-03-08.md`
  - `docs/MAP_SEARCH_PARITY_REPORT_2026-03-08.json`

## 2026-03-08 실행 로그 (게이트 회복 + parity 재실행)

### A. geocode:maintain 추가 반복
1) 1회 추가 실행:
- exactRatio: 0.7843
- failRatio: 0.0201
- 결과: strict FAIL (`exactRatio < 0.80`)

2) 2회 추가 실행:
- exactRatio: 0.8061
- failRatio: 0.0199
- 결과: strict PASS (`exact >= 0.80`, `fail <= 0.05`)

### B. parity 재실행
- 명령: `npm run qa:parity`
- 결과: 전체 PASS (직전 1건 FAIL 재현되지 않음)
- 리포트 갱신:
  - `docs/MAP_SEARCH_PARITY_REPORT_2026-03-08.md`
  - `docs/MAP_SEARCH_PARITY_REPORT_2026-03-08.json`

## 2026-03-08 실행 로그 (송파 202501~202505 배치 확인 + 정합성)

### A. 송파(11710) 월별 커버리지 확인
- 기준 구간: `202501` ~ `202505`
- raw 집계:
  - 202505: 388
  - 202504: 131
  - 202503: 913
  - 202502: 716
  - 202501: 323

### B. normalize 정합성 확인
- normalized 집계(동일 구간):
  - 202505: 400
  - 202504: 132
  - 202503: 923
  - 202502: 723
  - 202501: 325
- 후속 실행:
  - `npm run db:normalize` 완료 (`Applied SQL: sql/003_normalize_from_raw.sql`)

### C. 위치 정확도 게이트 재확인
- 명령: `npm run geocode:maintain`
- 최종:
  - total: 5714
  - exact: 4608
  - approx: 1106
  - pending: 876
  - failed: 89
  - permanentFailed: 141
  - exactRatio: 0.8064
  - failRatio: 0.0156
- 결과: strict PASS (`exact >= 0.80`, `fail <= 0.05`)

### D. 타깃 단지 포함 여부 점검
- 쿼리: 강동(11740) `apt_name ilike '%올림픽파크포레온%'`
- 결과: DB 매칭 0건
- 해석:
  - API 원본에는 존재(둔촌동, `202412~202510`)하나
  - 현재 DB에는 해당 구간 강동 백필이 충분히 반영되지 않아 미포함 상태

## 2026-03-10 실행 로그 (강동 202412~202510 타깃 백필 + gate/parity 재확인)

### A. 강동(11740) 월별 타깃 백필 + 배치 normalize
- 실행 방식: `1개월 단위 ingest -> 즉시 normalize`
- 대상 월: `202412, 202501, 202502, 202503, 202504, 202505, 202506, 202507, 202508, 202509, 202510`
- 월별 결과:
  - 202510: fetched 587, raw inserted 546, norm inserted 551
  - 202509: fetched 837, raw inserted 794, norm inserted 801
  - 202508: fetched 359, raw inserted 338, norm inserted 341
  - 202507: fetched 214, raw inserted 203, norm inserted 205
  - 202506: fetched 988, raw inserted 887, norm inserted 906
  - 202505: fetched 577, raw inserted 517, norm inserted 530
  - 202504: fetched 327, raw inserted 300, norm inserted 304
  - 202503: fetched 660, raw inserted 602, norm inserted 609
  - 202502: fetched 421, raw inserted 390, norm inserted 396
  - 202501: fetched 206, raw inserted 182, norm inserted 187
  - 202412: fetched 259, raw inserted 211, norm inserted 213

합계:
- fetched 5,435
- raw inserted 4,970
- norm inserted 5,043

### B. gate 재확인 (`geocode:maintain`)
- 명령: `npm run geocode:maintain`
- 최종:
  - total: 5924
  - exact: 4786
  - approx: 1138
  - pending: 889
  - failed: 99
  - permanentFailed: 150
  - exactRatio: 0.8079
  - failRatio: 0.0167
- 결과: strict PASS (`exact >= 0.80`, `fail <= 0.05`)

### C. parity 재확인 (`qa:parity`)
- 명령: `npm run qa:parity`
- 결과: 전체 PASS (72/72)
- 리포트 갱신:
  - `docs/MAP_SEARCH_PARITY_REPORT_2026-03-09.md`
  - `docs/MAP_SEARCH_PARITY_REPORT_2026-03-09.json`

## 2026-03-10 실행 로그 (강동 11740 갭 해소: 202511~202512)

### A. 202511 적재 + 정규화
- 명령: `npm run ingest:molit -- --regions=11740 --dealYmd=202511 --maxPerRegion=5000`
- 결과: fetched 116, raw inserted 110, norm inserted 111
- 정규화: `npm run db:normalize` 완료

### B. 202512 적재 + 정규화
- 명령: `npm run ingest:molit -- --regions=11740 --dealYmd=202512 --maxPerRegion=5000`
- 결과: fetched 213, raw inserted 213, norm inserted 213
- 정규화: `npm run db:normalize` 완료

### C. 확인
- raw 집계(11740, 202511~202512):
  - 202511: 110
  - 202512: 213

## 2026-03-10 실행 로그 (gate/parity 재확인)

### A. geocode:maintain
- 명령: `npm run geocode:maintain`
- 최종:
  - total: 5940
  - exact: 4786
  - approx: 1154
  - pending: 889
  - failed: 99
  - permanentFailed: 150
  - exactRatio: 0.8057
  - failRatio: 0.0167
- 결과: strict PASS (`exact >= 0.80`, `fail <= 0.05`)

### B. qa:parity
- 명령: `npm run qa:parity`
- 결과: 1건 FAIL
  - `brand_xi__seoul_wide__price_asc`
  - note: onlySearch=26455 onlyMap=32790
- 리포트 생성:
  - `docs/MAP_SEARCH_PARITY_REPORT_2026-03-10.md`
  - `docs/MAP_SEARCH_PARITY_REPORT_2026-03-10.json`

## 2026-03-10 실행 로그 (강남 11680 갭 해소: 202503~202509)

### A. 202503~202509 월별 적재 + 배치 normalize
- 방식: 월 단위 적재 후 즉시 `db:normalize`
- 월별 결과:
  - 202503: fetched 917, raw inserted 853, norm inserted 860
  - 202504: fetched 128, raw inserted 113, norm inserted 114
  - 202505: fetched 290, raw inserted 260, norm inserted 265
  - 202506: fetched 610, raw inserted 536, norm inserted 543
  - 202507: fetched 376, raw inserted 338, norm inserted 343
  - 202508: fetched 128, raw inserted 117, norm inserted 118
  - 202509: fetched 232, raw inserted 224, norm inserted 225

합계:
- fetched 2,681
- raw inserted 2,441
- norm inserted 2,468

## 2026-03-10 실행 로그 (강남 후 gate/parity 재확인)

### A. geocode:maintain
- 명령: `npm run geocode:maintain`
- 최종:
  - total: 6057
  - exact: 4846
  - approx: 1211
  - pending: 956
  - failed: 47
  - permanentFailed: 208
  - exactRatio: 0.8001
  - failRatio: 0.0078
- 결과: strict PASS (`exact >= 0.80`, `fail <= 0.05`)

### B. qa:parity
- 명령: `npm run qa:parity`
- 결과: 전체 PASS (72/72)
- 리포트 갱신:
  - `docs/MAP_SEARCH_PARITY_REPORT_2026-03-10.md`
  - `docs/MAP_SEARCH_PARITY_REPORT_2026-03-10.json`

## 2026-03-10 실행 로그 (마포 11440 갭 해소: 202503~202509)

### A. 202503~202509 월별 적재 + 배치 normalize
- 방식: 월 단위 적재 후 즉시 `db:normalize`
- 월별 결과:
  - 202503: fetched 588, raw inserted 534, norm inserted 549
  - 202504: fetched 362, raw inserted 331, norm inserted 339
  - 202505: fetched 476, raw inserted 437, norm inserted 448
  - 202506: fetched 741, raw inserted 668, norm inserted 686
  - 202507: fetched 141, raw inserted 129, norm inserted 132
  - 202508: fetched 193, raw inserted 181, norm inserted 185
  - 202509: fetched 550, raw inserted 532, norm inserted 540

합계:
- fetched 3,051
- raw inserted 2,812
- norm inserted 2,879

## 2026-03-10 실행 로그 (마포 후 gate/parity 재확인)

### A. geocode:maintain
- 명령: `npm run geocode:maintain`
- 최종:
  - total: 6119
  - exact: 4895
  - approx: 1224
  - pending: 1017
  - failed: 31
  - permanentFailed: 176
  - exactRatio: 0.8000
  - failRatio: 0.0051
- 결과: strict PASS (`exact >= 0.80`, `fail <= 0.05`)

### B. qa:parity
- 명령: `npm run qa:parity`
- 결과: 전체 PASS (72/72)
- 리포트 갱신:
  - `docs/MAP_SEARCH_PARITY_REPORT_2026-03-10.md`
  - `docs/MAP_SEARCH_PARITY_REPORT_2026-03-10.json`

## 2026-03-10 실행 로그 (서초 11650 갭 해소: 202503~202509)

### A. 202503~202509 월별 적재 + 배치 normalize
- 방식: 월 단위 적재 후 즉시 `db:normalize`
- 월별 결과:
  - 202503: fetched 691, raw inserted 660, norm inserted 665
  - 202504: fetched 62, raw inserted 59, norm inserted 59
  - 202505: fetched 175, raw inserted 159, norm inserted 162
  - 202506: fetched 384, raw inserted 336, norm inserted 345
  - 202507: fetched 234, raw inserted 209, norm inserted 214
  - 202508: fetched 108, raw inserted 100, norm inserted 101
  - 202509: fetched 125, raw inserted 122, norm inserted 122

합계:
- fetched 1,779
- raw inserted 1,645
- norm inserted 1,668

## 2026-03-10 실행 로그 (서초 후 gate/parity 재확인)

### A. geocode:maintain
- 명령: `npm run geocode:maintain`
- 최종:
  - total: 6225
  - exact: 5010
  - approx: 1215
  - pending: 1008
  - failed: 29
  - permanentFailed: 178
  - exactRatio: 0.8048
  - failRatio: 0.0047
- 결과: strict PASS (`exact >= 0.80`, `fail <= 0.05`)

### B. qa:parity
- 명령: `npm run qa:parity`
- 결과: 전체 PASS (72/72)
- 리포트 갱신:
  - `docs/MAP_SEARCH_PARITY_REPORT_2026-03-10.md`
  - `docs/MAP_SEARCH_PARITY_REPORT_2026-03-10.json`

## 2026-03-10 실행 로그 (성동 11200 갭 해소: 202503~202509)

### A. 202503~202509 월별 적재 + 배치 normalize
- 방식: 월 단위 적재 후 즉시 `db:normalize`
- 월별 결과:
  - 202503: fetched 680, raw inserted 602, norm inserted 613
  - 202504: fetched 387, raw inserted 328, norm inserted 334
  - 202505: fetched 592, raw inserted 524, norm inserted 534
  - 202506: fetched 859, raw inserted 778, norm inserted 783
  - 202507: fetched 121, raw inserted 108, norm inserted 109
  - 202508: fetched 233, raw inserted 212, norm inserted 213
  - 202509: fetched 589, raw inserted 566, norm inserted 567

합계:
- fetched 3,461
- raw inserted 3,118
- norm inserted 3,153

## 2026-03-11 실행 로그 (성동 후 gate/parity 재확인)

### A. geocode:maintain
- 명령: `npm run geocode:maintain`
- 최종:
  - total: 6252
  - exact: 5010
  - approx: 1242
  - pending: 1008
  - failed: 29
  - permanentFailed: 178
  - exactRatio: 0.8013
  - failRatio: 0.0046
- 결과: strict PASS (`exact >= 0.80`, `fail <= 0.05`)

### B. qa:parity
- 명령: `npm run qa:parity`
- 결과: 전체 PASS (72/72)
- 리포트 갱신:
  - `docs/MAP_SEARCH_PARITY_REPORT_2026-03-10.md`
  - `docs/MAP_SEARCH_PARITY_REPORT_2026-03-10.json`

## 2026-03-11 실행 로그 (용산 11170 갭 해소: 202503~202509)

### A. 202503~202509 월별 적재 + 배치 normalize
- 방식: 월 단위 적재 후 즉시 `db:normalize`
- 월별 결과:
  - 202503: fetched 299, raw inserted 278, norm inserted 281
  - 202504: fetched 43, raw inserted 39, norm inserted 40
  - 202505: fetched 92, raw inserted 82, norm inserted 82
  - 202506: fetched 169, raw inserted 149, norm inserted 150
  - 202507: fetched 152, raw inserted 133, norm inserted 139
  - 202508: fetched 148, raw inserted 133, norm inserted 145
  - 202509: fetched 147, raw inserted 121, norm inserted 139

합계:
- fetched 1,050
- raw inserted 935
- norm inserted 976

## 2026-03-11 실행 로그 (용산 후 gate/parity 재확인)

### A. geocode:maintain
- 명령: `npm run geocode:maintain`
- 최종:
  - total: 6338
  - exact: 5109
  - approx: 1229
  - pending: 1007
  - failed: 32
  - permanentFailed: 190
  - exactRatio: 0.8061
  - failRatio: 0.0050
- 결과: strict PASS (`exact >= 0.80`, `fail <= 0.05`)

### B. qa:parity
- 명령: `npm run qa:parity`
- 결과: 전체 PASS (72/72)
- 리포트 갱신:
  - `docs/MAP_SEARCH_PARITY_REPORT_2026-03-10.md`
  - `docs/MAP_SEARCH_PARITY_REPORT_2026-03-10.json`

## 2026-03-11 실행 로그 (광진 11215 갭 해소: 202506~202509)

### A. 202506~202509 월별 적재 + 배치 normalize
- 방식: 월 단위 적재 후 즉시 `db:normalize`
- 월별 결과:
  - 202506: fetched 356, raw inserted 0, norm inserted 21
  - 202507: fetched 82, raw inserted 75, norm inserted 75
  - 202508: fetched 106, raw inserted 98, norm inserted 99
  - 202509: fetched 306, raw inserted 289, norm inserted 290

## 2026-03-12 실행 로그 (geocode:maintain + parity 재확인)

### A. geocode:maintain
- 명령: `npm run geocode:maintain`
- 최종:
  - total: 6444
  - exact: 5157
  - approx: 1287
  - pending: 1067
  - failed: 34
  - permanentFailed: 186
  - exactRatio: 0.8003
  - failRatio: 0.0053
- 결과: strict PASS (`exact >= 0.80`, `fail <= 0.05`)

### B. qa:parity
- 명령: `npm run qa:parity`
- 결과: 전체 PASS (72/72)
- 리포트 생성:
  - `docs/MAP_SEARCH_PARITY_REPORT_2026-03-11.md`
  - `docs/MAP_SEARCH_PARITY_REPORT_2026-03-11.json`
- note: 리포트 파일명은 UTC 기준 날짜로 저장됨

## 2026-03-12 실행 로그 (광진 11215 갭 해소: 202510~202602)

### A. 202510~202602 월별 적재 + 배치 normalize
- 방식: 월 단위 적재 후 즉시 `db:normalize`
- 월별 결과:
  - 202510: fetched 273, raw inserted 249, norm inserted 264
  - 202511: fetched 38, raw inserted 36, norm inserted 37
  - 202512: fetched 67, raw inserted 63, norm inserted 64
  - 202601: fetched 67, raw inserted 2, norm inserted 12
  - 202602: fetched 58, raw inserted 17, norm inserted 20

## 2026-03-12 실행 로그 (geocode:maintain + parity 재실행)

### A. geocode:maintain
- 명령: `npm run geocode:maintain`
- 최종:
  - total: 6452
  - exact: 5204
  - approx: 1248
  - pending: 1025
  - failed: 37
  - permanentFailed: 186
  - exactRatio: 0.8066
  - failRatio: 0.0057
- 결과: strict PASS (`exact >= 0.80`, `fail <= 0.05`)

### B. qa:parity
- 명령: `npm run qa:parity`
- 결과: 전체 PASS (72/72)
- 리포트 생성:
  - `docs/MAP_SEARCH_PARITY_REPORT_2026-03-11.md`
  - `docs/MAP_SEARCH_PARITY_REPORT_2026-03-11.json`
- note: 리포트 파일명은 UTC 기준 날짜로 저장됨

## 2026-03-12 실행 로그 (노원 11350 갭 해소: 202503~202512)

### A. 202503~202512 월별 적재 + 배치 normalize
- 방식: 월 단위 적재 후 즉시 `db:normalize`
- 월별 결과:
  - 202503: fetched 601, raw inserted 0, norm inserted 45
  - 202504: fetched 418, raw inserted 393, norm inserted 394
  - 202505: fetched 570, raw inserted 540, norm inserted 542
  - 202506: fetched 885, raw inserted 0, norm inserted 82
  - 202507: fetched 342, raw inserted 321, norm inserted 324
  - 202508: fetched 384, raw inserted 368, norm inserted 370
  - 202509: fetched 591, raw inserted 572, norm inserted 573
  - 202510: fetched 665, raw inserted 644, norm inserted 648
  - 202511: fetched 235, raw inserted 234, norm inserted 234
  - 202512: fetched 514, raw inserted 490, norm inserted 507

## 2026-03-12 실행 로그 (노원 11350 반영 후 gate/parity 재확인)

### A. geocode:maintain
- 명령: `npm run geocode:maintain`
- 최종:
  - total: 6529
  - exact: 5267
  - approx: 1262
  - pending: 1053
  - failed: 27
  - permanentFailed: 182
  - exactRatio: 0.8067
  - failRatio: 0.0041
- 결과: strict PASS (`exact >= 0.80`, `fail <= 0.05`)

### B. qa:parity
- 명령: `npm run qa:parity`
- 결과: 전체 PASS (72/72)
- 리포트 생성:
  - `docs/MAP_SEARCH_PARITY_REPORT_2026-03-12.md`
  - `docs/MAP_SEARCH_PARITY_REPORT_2026-03-12.json`

## 2026-03-12 실행 로그 (성북 11290 갭 해소: 202503~202512)

### A. 202503~202512 월별 적재 + 배치 normalize
- 방식: 월 단위 적재 후 즉시 `db:normalize`
- 월별 결과:
  - 202503: fetched 455, raw inserted 410, norm inserted 415
  - 202504: fetched 346, raw inserted 320, norm inserted 322
  - 202505: fetched 475, raw inserted 424, norm inserted 434
  - 202506: fetched 660, raw inserted 605, norm inserted 620
  - 202507: fetched 232, raw inserted 209, norm inserted 213
  - 202508: fetched 362, raw inserted 314, norm inserted 343
  - 202509: fetched 545, raw inserted 517, norm inserted 522
  - 202510: fetched 514, raw inserted 492, norm inserted 493
  - 202511: fetched 207, raw inserted 198, norm inserted 198
  - 202512: fetched 322, raw inserted 311, norm inserted 314

## 2026-03-12 실행 로그 (성북 11290 반영 후 gate/parity 재확인)

### A. geocode:maintain
- 명령: `npm run geocode:maintain`
- 최종:
  - total: 6566
  - exact: 5267
  - approx: 1299
  - pending: 1053
  - failed: 27
  - permanentFailed: 182
  - exactRatio: 0.8022
  - failRatio: 0.0041
- 결과: strict PASS (`exact >= 0.80`, `fail <= 0.05`)

### B. qa:parity
- 명령: `npm run qa:parity`
- 결과: 전체 PASS (72/72)
- 리포트 생성:
  - `docs/MAP_SEARCH_PARITY_REPORT_2026-03-12.md`
  - `docs/MAP_SEARCH_PARITY_REPORT_2026-03-12.json`

## 2026-03-12 실행 로그 (구로 11530 갭 해소: 202503~202512)

### A. 202503~202512 월별 적재 + 배치 normalize
- 방식: 월 단위 적재 후 즉시 `db:normalize`
- 월별 결과:
  - 202503: fetched 359, raw inserted 329, norm inserted 331
  - 202504: fetched 280, raw inserted 260, norm inserted 265
  - 202505: fetched 691, raw inserted 368, norm inserted 670
  - 202506: fetched 495, raw inserted 454, norm inserted 464
  - 202507: fetched 219, raw inserted 200, norm inserted 203
  - 202508: fetched 228, raw inserted 218, norm inserted 220
  - 202509: fetched 350, raw inserted 333, norm inserted 335
  - 202510: fetched 347, raw inserted 339, norm inserted 339
  - 202511: fetched 165, raw inserted 164, norm inserted 164
  - 202512: fetched 283, raw inserted 277, norm inserted 278

## 2026-03-12 실행 로그 (구로 11530 반영 후 gate/parity 재확인)

### A. geocode:maintain
- 명령: `npm run geocode:maintain`
- 최종:
  - total: 6727
  - exact: 5424
  - approx: 1303
  - pending: 1091
  - failed: 22
  - permanentFailed: 190
  - exactRatio: 0.8063
  - failRatio: 0.0033
- 결과: strict PASS (`exact >= 0.80`, `fail <= 0.05`)

### B. qa:parity
- 명령: `npm run qa:parity`
- 결과: 전체 PASS (72/72)
- 리포트 생성:
- `docs/MAP_SEARCH_PARITY_REPORT_2026-03-12.md`
- `docs/MAP_SEARCH_PARITY_REPORT_2026-03-12.json`

## 2026-03-13 실행 로그 (은평 11380 갭 해소: 202503~202602)

### A. 202503~202602 월별 적재 + 배치 normalize
방식: 월 단위 적재 후 즉시 `db:normalize`

월별 결과:
- 202503: fetched 280, raw inserted 0, norm inserted 51
- 202504: fetched 198, raw inserted 192, norm inserted 192
- 202505: fetched 254, raw inserted 236, norm inserted 239
- 202506: fetched 418, raw inserted 389, norm inserted 395
- 202507: fetched 215, raw inserted 193, norm inserted 197
- 202508: fetched 218, raw inserted 200, norm inserted 203
- 202509: fetched 317, raw inserted 302, norm inserted 302
- 202510: fetched 381, raw inserted 363, norm inserted 368
- 202511: fetched 188, raw inserted 177, norm inserted 179
- 202512: fetched 219, raw inserted 211, norm inserted 212
- 202601: fetched 272, raw inserted 2, norm inserted 51
- 202602: fetched 288, raw inserted 86, norm inserted 130

### B. geocode:maintain
- 명령: `npm run geocode:maintain`
- 최종:
  - total: 6908
  - exact: 5554
  - approx: 1354
  - pending: 1138
  - failed: 28
  - permanentFailed: 188
  - exactRatio: 0.804
  - failRatio: 0.0041
- 결과: strict PASS (`exact >= 0.80`, `fail <= 0.05`)

### C. qa:parity
- 명령: `npm run qa:parity`
- 결과: 전체 PASS (72/72)
- 리포트 생성:
  - `docs/MAP_SEARCH_PARITY_REPORT_2026-03-12.md`
  - `docs/MAP_SEARCH_PARITY_REPORT_2026-03-12.json`
- note: 리포트 파일명은 UTC 기준 날짜로 저장됨

## 2026-03-13 실행 로그 (강서 11500 갭 해소: 202503~202602)

### A. 202503~202602 월별 적재 + 배치 normalize
방식: 월 단위 적재 후 즉시 `db:normalize`

월별 결과:
- 202503: fetched 462, raw inserted 429, norm inserted 435
- 202504: fetched 359, raw inserted 332, norm inserted 339
- 202505: fetched 508, raw inserted 435, norm inserted 438
- 202506: fetched 605, raw inserted 573, norm inserted 577
- 202507: fetched 270, raw inserted 237, norm inserted 239
- 202508: fetched 285, raw inserted 271, norm inserted 272
- 202509: fetched 604, raw inserted 592, norm inserted 593
- 202510: fetched 603, raw inserted 583, norm inserted 587
- 202511: fetched 188, raw inserted 182, norm inserted 182
- 202512: fetched 316, raw inserted 300, norm inserted 300
- 202601: fetched 373, raw inserted 15, norm inserted 67
- 202602: fetched 314, raw inserted 208, norm inserted 221

### B. geocode:maintain
- 명령: `npm run geocode:maintain`
- 최종:
  - total: 7133
  - exact: 5753
  - approx: 1380
  - pending: 1138
  - failed: 35
  - permanentFailed: 207
  - exactRatio: 0.8065
  - failRatio: 0.0049
- 결과: strict PASS (`exact >= 0.80`, `fail <= 0.05`)

### C. qa:parity
- 명령: `npm run qa:parity`
- 결과: 전체 PASS (72/72)
- 리포트 생성:
  - `docs/MAP_SEARCH_PARITY_REPORT_2026-03-12.md`
  - `docs/MAP_SEARCH_PARITY_REPORT_2026-03-12.json`
- note: 리포트 파일명은 UTC 기준 날짜로 저장됨

## 2026-03-13 실행 로그 (동대문 11230 갭 해소: 202503~202602)

### A. 202503~202602 월별 적재 + 배치 normalize
방식: 월 단위 적재 후 즉시 `db:normalize`

월별 결과:
- 202503: fetched 425, raw inserted 386, norm inserted 391
- 202504: fetched 347, raw inserted 295, norm inserted 325
- 202505: fetched 366, raw inserted 331, norm inserted 334
- 202506: fetched 574, raw inserted 517, norm inserted 520
- 202507: fetched 202, raw inserted 183, norm inserted 185
- 202508: fetched 234, raw inserted 218, norm inserted 220
- 202509: fetched 506, raw inserted 488, norm inserted 489
- 202510: fetched 546, raw inserted 521, norm inserted 524
- 202511: fetched 145, raw inserted 141, norm inserted 141
- 202512: fetched 285, raw inserted 259, norm inserted 280
- 202601: fetched 296, raw inserted 4, norm inserted 54
- 202602: fetched 203, raw inserted 55, norm inserted 78

### B. geocode:maintain
- 명령: `npm run geocode:maintain`
- 최종:
  - total: 7231
  - exact: 5800
  - approx: 1431
  - pending: 1189
  - failed: 38
  - permanentFailed: 204
  - exactRatio: 0.8021
  - failRatio: 0.0053
- 결과: strict PASS (`exact >= 0.80`, `fail <= 0.05`)

### C. qa:parity
- 명령: `npm run qa:parity`
- 결과: 전체 PASS (72/72)
- 리포트 생성:
  - `docs/MAP_SEARCH_PARITY_REPORT_2026-03-13.md`
  - `docs/MAP_SEARCH_PARITY_REPORT_2026-03-13.json`
- note: 리포트 파일명은 UTC 기준 날짜로 저장됨

## 2026-03-13 실행 로그 (양천 11470 갭 해소: 202503~202602)

### A. 202503~202602 월별 적재 + 배치 normalize
방식: 월 단위 적재 후 즉시 `db:normalize`

월별 결과:
- 202503: fetched 497, raw inserted 458, norm inserted 461
- 202504: fetched 328, raw inserted 303, norm inserted 308
- 202505: fetched 413, raw inserted 376, norm inserted 381
- 202506: fetched 597, raw inserted 537, norm inserted 542
- 202507: fetched 199, raw inserted 178, norm inserted 179
- 202508: fetched 131, raw inserted 123, norm inserted 125
- 202509: fetched 372, raw inserted 359, norm inserted 360
- 202510: fetched 435, raw inserted 421, norm inserted 421
- 202511: fetched 164, raw inserted 164, norm inserted 164
- 202512: fetched 220, raw inserted 217, norm inserted 218
- 202601: fetched 241, raw inserted 4, norm inserted 24
- 202602: fetched 233, raw inserted 67, norm inserted 80

### B. geocode:maintain
- 명령: `npm run geocode:maintain`
- 최종:
  - total: 7410
  - exact: 5970
  - approx: 1440
  - pending: 1184
  - failed: 45
  - permanentFailed: 211
  - exactRatio: 0.8057
  - failRatio: 0.0061
- 결과: strict PASS (`exact >= 0.80`, `fail <= 0.05`)

### C. qa:parity
- 명령: `npm run qa:parity`
- 결과: 전체 PASS (72/72)
- 리포트 생성:
  - `docs/MAP_SEARCH_PARITY_REPORT_2026-03-13.md`
  - `docs/MAP_SEARCH_PARITY_REPORT_2026-03-13.json`
- note: 리포트 파일명은 UTC 기준 날짜로 저장됨

## 2026-03-13 실행 로그 (서대문 11410 갭 해소: 202503~202602)

### A. 202503~202602 월별 적재 + 배치 normalize
방식: 월 단위 적재 후 즉시 `db:normalize`

월별 결과:
- 202503: fetched 330, raw inserted 298, norm inserted 304
- 202504: fetched 269, raw inserted 252, norm inserted 257
- 202505: fetched 371, raw inserted 329, norm inserted 335
- 202506: fetched 578, raw inserted 514, norm inserted 533
- 202507: fetched 135, raw inserted 123, norm inserted 127
- 202508: fetched 161, raw inserted 144, norm inserted 147
- 202509: fetched 367, raw inserted 352, norm inserted 356
- 202510: fetched 414, raw inserted 402, norm inserted 406
- 202511: fetched 141, raw inserted 137, norm inserted 138
- 202512: fetched 241, raw inserted 238, norm inserted 240
- 202601: fetched 262, raw inserted 0, norm inserted 51
- 202602: fetched 189, raw inserted 50, norm inserted 69

### B. geocode:maintain
- 명령: `npm run geocode:maintain`
- 최종:
  - total: 7504
  - exact: 6037
  - approx: 1467
  - pending: 1203
  - failed: 45
  - permanentFailed: 219
  - exactRatio: 0.8045
  - failRatio: 0.006
- 결과: strict PASS (`exact >= 0.80`, `fail <= 0.05`)

### C. qa:parity
- 명령: `npm run qa:parity`
- 결과: 전체 PASS (72/72)
- 리포트 생성:
  - `docs/MAP_SEARCH_PARITY_REPORT_2026-03-13.md`
  - `docs/MAP_SEARCH_PARITY_REPORT_2026-03-13.json`
- note: 리포트 파일명은 UTC 기준 날짜로 저장됨

## 2026-03-14 실행 로그 (영등포 11560 갭 해소: 202503~202602)

### A. 202503~202602 월별 적재 + 배치 normalize
방식: 월 단위 적재 후 즉시 `db:normalize`

월별 결과:
- 202503: fetched 565, raw inserted 525, norm inserted 530
- 202504: fetched 389, raw inserted 358, norm inserted 364
- 202505: fetched 532, raw inserted 492, norm inserted 497
- 202506: fetched 769, raw inserted 692, norm inserted 697
- 202507: fetched 257, raw inserted 231, norm inserted 232
- 202508: fetched 245, raw inserted 234, norm inserted 236
- 202509: fetched 500, raw inserted 488, norm inserted 489
- 202510: fetched 458, raw inserted 449, norm inserted 449
- 202511: fetched 109, raw inserted 109, norm inserted 109
- 202512: fetched 237, raw inserted 235, norm inserted 235
- 202601: fetched 264, raw inserted 8, norm inserted 34
- 202602: fetched 275, raw inserted 116, norm inserted 130

### B. geocode:maintain
- 명령: `npm run geocode:maintain`
- 최종:
  - total: 7589
  - exact: 6083
  - approx: 1506
  - pending: 1249
  - failed: 49
  - permanentFailed: 208
  - exactRatio: 0.8016
  - failRatio: 0.0065
- 결과: strict PASS (`exact >= 0.80`, `fail <= 0.05`)

### C. qa:parity
- 명령: `npm run qa:parity`
- 결과: 전체 PASS (72/72)
- 리포트 생성:
  - `docs/MAP_SEARCH_PARITY_REPORT_2026-03-13.md`
  - `docs/MAP_SEARCH_PARITY_REPORT_2026-03-13.json`
- note: 리포트 파일명은 UTC 기준 날짜로 저장됨

## 2026-03-14 실행 로그 (관악 11620 갭 해소: 202503~202602)

### A. 202503~202602 월별 적재 + 배치 normalize
방식: 월 단위 적재 후 즉시 `db:normalize`

월별 결과:
- 202503: fetched 262, raw inserted 245, norm inserted 245
- 202504: fetched 187, raw inserted 176, norm inserted 176
- 202505: fetched 231, raw inserted 216, norm inserted 216
- 202506: fetched 310, raw inserted 302, norm inserted 302
- 202507: fetched 151, raw inserted 144, norm inserted 144
- 202508: fetched 149, raw inserted 141, norm inserted 141
- 202509: fetched 302, raw inserted 293, norm inserted 294
- 202510: fetched 297, raw inserted 287, norm inserted 289
- 202511: fetched 103, raw inserted 100, norm inserted 100
- 202512: fetched 167, raw inserted 162, norm inserted 162
- 202601: fetched 195, raw inserted 1, norm inserted 10
- 202602: fetched 210, raw inserted 64, norm inserted 69

### B. geocode:maintain
- 명령: `npm run geocode:maintain`
- 최종:
  - total: 7685
  - exact: 6156
  - approx: 1529
  - pending: 1254
  - failed: 56
  - permanentFailed: 219
  - exactRatio: 0.801
  - failRatio: 0.0073
- 결과: strict PASS (`exact >= 0.80`, `fail <= 0.05`)

### C. qa:parity
- 명령: `npm run qa:parity`
- 결과: 전체 PASS (72/72)
- 리포트 생성:
  - `docs/MAP_SEARCH_PARITY_REPORT_2026-03-13.md`
  - `docs/MAP_SEARCH_PARITY_REPORT_2026-03-13.json`
- note: 리포트 파일명은 UTC 기준 날짜로 저장됨

## 2026-03-14 실행 로그 (중랑 11260 갭 해소: 202503~202602)

### A. 202503~202602 월별 적재 + 배치 normalize
방식: 월 단위 적재 후 즉시 `db:normalize`

월별 결과:
- 202503: fetched 188, raw inserted 175, norm inserted 176
- 202504: fetched 148, raw inserted 139, norm inserted 140
- 202505: fetched 195, raw inserted 175, norm inserted 179
- 202506: fetched 312, raw inserted 257, norm inserted 263
- 202507: fetched 137, raw inserted 121, norm inserted 121
- 202508: fetched 134, raw inserted 128, norm inserted 128
- 202509: fetched 309, raw inserted 247, norm inserted 252
- 202510: fetched 254, raw inserted 241, norm inserted 246
- 202511: fetched 101, raw inserted 98, norm inserted 99
- 202512: fetched 154, raw inserted 153, norm inserted 153
- 202601: fetched 194, raw inserted 1, norm inserted 46
- 202602: fetched 180, raw inserted 65, norm inserted 92

### B. geocode:maintain
- 명령: `npm run geocode:maintain`
- 최종:
  - total: 7790
  - exact: 6276
  - approx: 1514
  - pending: 1234
  - failed: 62
  - permanentFailed: 218
  - exactRatio: 0.8056
  - failRatio: 0.008
- 결과: strict PASS (`exact >= 0.80`, `fail <= 0.05`)

### C. qa:parity
- 명령: `npm run qa:parity`
- 결과: 전체 PASS (72/72)
- 리포트 생성:
  - `docs/MAP_SEARCH_PARITY_REPORT_2026-03-14.md`
  - `docs/MAP_SEARCH_PARITY_REPORT_2026-03-14.json`
- note: 리포트 파일명은 UTC 기준 날짜로 저장됨

## 2026-03-14 실행 로그 (도봉 11320 갭 해소: 202503~202602)

### A. 202503~202602 월별 적재 + 배치 normalize
방식: 월 단위 적재 후 즉시 `db:normalize`

월별 결과:
- 202503: fetched 176, raw inserted 172, norm inserted 172
- 202504: fetched 157, raw inserted 150, norm inserted 150
- 202505: fetched 161, raw inserted 153, norm inserted 154
- 202506: fetched 308, raw inserted 288, norm inserted 292
- 202507: fetched 148, raw inserted 136, norm inserted 137
- 202508: fetched 144, raw inserted 136, norm inserted 136
- 202509: fetched 200, raw inserted 196, norm inserted 196
- 202510: fetched 158, raw inserted 156, norm inserted 157
- 202511: fetched 101, raw inserted 98, norm inserted 98
- 202512: fetched 144, raw inserted 141, norm inserted 141
- 202601: fetched 170, raw inserted 0, norm inserted 32
- 202602: fetched 170, raw inserted 43, norm inserted 54

### B. geocode:maintain
- 명령: `npm run geocode:maintain`
- 최종:
  - total: 7862
  - exact: 6294
  - approx: 1568
  - pending: 1288
  - failed: 61
  - permanentFailed: 219
  - exactRatio: 0.8006
  - failRatio: 0.0078
- 결과: strict PASS (`exact >= 0.80`, `fail <= 0.05`)

### C. qa:parity
- 명령: `npm run qa:parity`
- 결과: 전체 PASS (72/72)
- 리포트 생성:
  - `docs/MAP_SEARCH_PARITY_REPORT_2026-03-14.md`
  - `docs/MAP_SEARCH_PARITY_REPORT_2026-03-14.json`
- note: 리포트 파일명은 UTC 기준 날짜로 저장됨

## 2026-03-14 실행 로그 (동작 11590 갭 해소: 202503~202602)

### A. 202503~202602 월별 적재 + 배치 normalize
방식: 월 단위 적재 후 즉시 `db:normalize`

월별 결과:
- 202503: fetched 577, raw inserted 534, norm inserted 552
- 202504: fetched 390, raw inserted 369, norm inserted 377
- 202505: fetched 528, raw inserted 486, norm inserted 500
- 202506: fetched 663, raw inserted 614, norm inserted 638
- 202507: fetched 148, raw inserted 141, norm inserted 142
- 202508: fetched 215, raw inserted 203, norm inserted 207
- 202509: fetched 497, raw inserted 486, norm inserted 490
- 202510: fetched 429, raw inserted 408, norm inserted 417
- 202511: fetched 83, raw inserted 77, norm inserted 77
- 202512: fetched 146, raw inserted 145, norm inserted 145
- 202601: fetched 198, raw inserted 9, norm inserted 80
- 202602: fetched 152, raw inserted 77, norm inserted 101

### B. geocode:maintain
- 명령: `npm run geocode:maintain`
- 최종:
  - total: 7943
  - exact: 6382
  - approx: 1561
  - pending: 1275
  - failed: 65
  - permanentFailed: 221
  - exactRatio: 0.8035
  - failRatio: 0.0082
- 결과: strict PASS (`exact >= 0.80`, `fail <= 0.05`)

### C. qa:parity
- 명령: `npm run qa:parity`
- 결과: 전체 PASS (72/72)
- 리포트 생성:
  - `docs/MAP_SEARCH_PARITY_REPORT_2026-03-14.md`
  - `docs/MAP_SEARCH_PARITY_REPORT_2026-03-14.json`
- note: 리포트 파일명은 UTC 기준 날짜로 저장됨

## 2026-03-14 실행 로그 (강북 11305 갭 해소: 202503~202602)

### A. 202503~202602 월별 적재 + 배치 normalize
방식: 월 단위 적재 후 즉시 `db:normalize`

월별 결과:
- 202503: fetched 104, raw inserted 100, norm inserted 103
- 202504: fetched 102, raw inserted 91, norm inserted 95
- 202505: fetched 128, raw inserted 113, norm inserted 113
- 202506: fetched 179, raw inserted 163, norm inserted 167
- 202507: fetched 87, raw inserted 80, norm inserted 83
- 202508: fetched 94, raw inserted 90, norm inserted 91
- 202509: fetched 120, raw inserted 116, norm inserted 117
- 202510: fetched 123, raw inserted 120, norm inserted 120
- 202511: fetched 73, raw inserted 71, norm inserted 72
- 202512: fetched 117, raw inserted 115, norm inserted 116
- 202601: fetched 125, raw inserted 4, norm inserted 18
- 202602: fetched 145, raw inserted 42, norm inserted 67

### B. geocode:maintain
- 명령: `npm run geocode:maintain`
- 최종:
  - total: 7992
  - exact: 6418
  - approx: 1574
  - pending: 1284
  - failed: 66
  - permanentFailed: 224
  - exactRatio: 0.8031
  - failRatio: 0.0083
- 결과: strict PASS (`exact >= 0.80`, `fail <= 0.05`)

### C. qa:parity
- 명령: `npm run qa:parity`
- 결과: 전체 PASS (72/72)
- 리포트 생성:
  - `docs/MAP_SEARCH_PARITY_REPORT_2026-03-14.md`
  - `docs/MAP_SEARCH_PARITY_REPORT_2026-03-14.json`
- note: 리포트 파일명은 UTC 기준 날짜로 저장됨

## 2026-03-14 실행 로그 (금천 11545 갭 해소: 202503~202602)

### A. 202503~202602 월별 적재 + 배치 normalize
방식: 월 단위 적재 후 즉시 `db:normalize`

월별 결과:
- 202503: fetched 98, raw inserted 90, norm inserted 95
- 202504: fetched 63, raw inserted 57, norm inserted 59
- 202505: fetched 78, raw inserted 71, norm inserted 73
- 202506: fetched 141, raw inserted 130, norm inserted 136
- 202507: fetched 63, raw inserted 58, norm inserted 60
- 202508: fetched 74, raw inserted 68, norm inserted 70
- 202509: fetched 85, raw inserted 83, norm inserted 84
- 202510: fetched 95, raw inserted 95, norm inserted 95
- 202511: fetched 53, raw inserted 52, norm inserted 53
- 202512: fetched 83, raw inserted 81, norm inserted 82
- 202601: fetched 118, raw inserted 1, norm inserted 32
- 202602: fetched 93, raw inserted 24, norm inserted 47

### B. geocode:maintain
- 명령: `npm run geocode:maintain`
- 최종:
  - total: 8042
  - exact: 6468
  - approx: 1574
  - pending: 1284
  - failed: 66
  - permanentFailed: 224
  - exactRatio: 0.8043
  - failRatio: 0.0082
- 결과: strict PASS (`exact >= 0.80`, `fail <= 0.05`)

### C. qa:parity
- 명령: `npm run qa:parity`
- 결과: 전체 PASS (72/72)
- 리포트 생성:
  - `docs/MAP_SEARCH_PARITY_REPORT_2026-03-14.md`
  - `docs/MAP_SEARCH_PARITY_REPORT_2026-03-14.json`
- note: 리포트 파일명은 UTC 기준 날짜로 저장됨

## 2026-03-14 실행 로그 (중구 11140 갭 해소: 202503~202602)

### A. 202503~202602 월별 적재 + 배치 normalize
방식: 월 단위 적재 후 즉시 `db:normalize`

월별 결과:
- 202503: fetched 178, raw inserted 159, norm inserted 159
- 202504: fetched 109, raw inserted 94, norm inserted 98
- 202505: fetched 127, raw inserted 114, norm inserted 116
- 202506: fetched 216, raw inserted 191, norm inserted 198
- 202507: fetched 56, raw inserted 48, norm inserted 48
- 202508: fetched 71, raw inserted 63, norm inserted 67
- 202509: fetched 162, raw inserted 155, norm inserted 156
- 202510: fetched 146, raw inserted 110, norm inserted 119
- 202511: fetched 34, raw inserted 32, norm inserted 32
- 202512: fetched 78, raw inserted 75, norm inserted 75
- 202601: fetched 77, raw inserted 6, norm inserted 21
- 202602: fetched 45, raw inserted 17, norm inserted 20

### B. geocode:maintain
- 명령: `npm run geocode:maintain`
- 최종:
  - total: 8100
  - exact: 6515
  - approx: 1585
  - pending: 1289
  - failed: 67
  - permanentFailed: 224
  - exactRatio: 0.8043
  - failRatio: 0.0083
- 결과: strict PASS (`exact >= 0.80`, `fail <= 0.05`)

### C. qa:parity
- 명령: `npm run qa:parity`
- 결과: 전체 PASS (72/72)
- 리포트 생성:
  - `docs/MAP_SEARCH_PARITY_REPORT_2026-03-14.md`
  - `docs/MAP_SEARCH_PARITY_REPORT_2026-03-14.json`
- note: 리포트 파일명은 UTC 기준 날짜로 저장됨

## 2026-03-14 실행 로그 (종로 11110 갭 해소: 202503~202602)

### A. 202503~202602 월별 적재 + 배치 normalize
방식: 월 단위 적재 후 즉시 `db:normalize`

월별 결과:
- 202503: fetched 90, raw inserted 81, norm inserted 88
- 202504: fetched 43, raw inserted 41, norm inserted 41
- 202505: fetched 61, raw inserted 58, norm inserted 60
- 202506: fetched 107, raw inserted 99, norm inserted 103
- 202507: fetched 40, raw inserted 35, norm inserted 37
- 202508: fetched 42, raw inserted 41, norm inserted 42
- 202509: fetched 67, raw inserted 65, norm inserted 66
- 202510: fetched 88, raw inserted 85, norm inserted 86
- 202511: fetched 22, raw inserted 22, norm inserted 22
- 202512: fetched 43, raw inserted 43, norm inserted 43
- 202601: fetched 46, raw inserted 1, norm inserted 14
- 202602: fetched 44, raw inserted 15, norm inserted 25

### B. geocode:maintain
- 명령: `npm run geocode:maintain`
- 최종:
  - total: 8146
  - exact: 6563
  - approx: 1583
  - pending: 1290
  - failed: 69
  - permanentFailed: 224
  - exactRatio: 0.8057
  - failRatio: 0.0085
- 결과: strict PASS (`exact >= 0.80`, `fail <= 0.05`)

### C. qa:parity
- 명령: `npm run qa:parity`
- 결과: 전체 PASS (72/72)
- 리포트 생성:
  - `docs/MAP_SEARCH_PARITY_REPORT_2026-03-14.md`
  - `docs/MAP_SEARCH_PARITY_REPORT_2026-03-14.json`
- note: 리포트 파일명은 UTC 기준 날짜로 저장됨

## 2026-03-16 실행 로그 (색인/SEO Day 1)

### A. robots/sitemap 확인
- `https://saljip.kr/robots.txt` 200 확인
- `https://saljip.kr/sitemap.xml` 200 확인

### B. Google Search Console 제출
- 홈(`/`) 색인 생성 요청 완료
- 대표 상세 5건 색인 생성 요청 완료:
  - `/complexes/452`
  - `/complexes/1`
  - `/complexes/500`
  - `/complexes/200`
  - `/complexes/800`

### C. Naver Search Advisor 제출
- 홈(`/`) URL 제출 완료
- 대표 상세 5건 URL 제출 완료 (동일 목록)

### D. GA 실시간 이벤트 확인
- `search_submit` 확인 (실시간 이벤트명: `search`)
- `complex_detail_view` 확인 (실시간 이벤트명: `view_complex_detail`)
- `cta_click` 확인

## 2026-03-17 실행 로그 (메타 벤치마크 + OG 정합성 보강)

### A. 메타 벤치마크 수집 (Playwright)
- 실행: `node scripts/meta-benchmark.mjs`
- 결과 파일: `notes/meta-benchmark.json`
- 타깃: 직방/다방/호갱노노 + KB부동산/부동산114/아실
- 요약:
  - 직방: 403/차단 추정 → 메타 미수집
  - 다방: canonical 있음, `og:url` 빈 값
  - 호갱노노: canonical 없음, `og:type` 없음
  - KB부동산: canonical 있음, `og:type` 없음
  - 부동산114: `og:url` http, canonical 없음
  - 아실: canonical http + deep path, `og:type` 없음

### B. 살집 메타 규칙 반영 (모방 금지, 템플릿 유지)
- 홈(`app/layout.tsx`)
  - `openGraph.locale = "ko_KR"` 추가
  - OG/Twitter 이미지 절대 URL로 고정 (`https://saljip.kr/og-default.png`)
- 상세(`app/complexes/[id]/page.tsx`)
  - canonical 절대 URL로 고정
  - `openGraph.locale = "ko_KR"` 추가
  - OG/Twitter 이미지 절대 URL로 고정

### C. 메타 렌더링 확인 (샘플)
- URL: `https://saljip.kr/complexes/452`
- 확인 항목:
  - `<link rel="canonical" href="https://saljip.kr/complexes/452">`
  - `og:url`, `og:type`, `og:image` 절대 URL
  - `twitter:image` 절대 URL

### D. 로컬 SSL 경고 사전 대응
- `.env.local`의 `DATABASE_URL`에서 `sslmode=require` → `sslmode=verify-full`로 변경
- 목적: 향후 pg/pg-connection-string 메이저 버전에서 보안 의미 변경 대비
