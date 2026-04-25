# 2026-04-25 Conversation Log

## 요청/진행 요약
- ingest/normalize 느린 원인 전수조사 및 제한 확인
  - ingest: `maxPerRegion` 컷 존재, 기본 fetch/page/DB write 병목 확인
  - normalize: 전수 스캔 + 중복체크 비용 이슈 확인
- 속도 최대화 작업 적용
  - `scripts/ingest-molit.mjs` 병렬/배치 옵션 및 bulk write 구조 반영
  - incremental normalize SQL/cron 구조 반영
  - 관련 SQL/문서/package 스크립트 업데이트

## 실행 작업(데이터 적재)
- 서울(25개구) `202601~202604` 적재 + normalize 완료
- 경기도(41xxx, 실행코드 47개) `202501~202604` 적재 + normalize 완료
- 부산(16개구/군) `202601~202604` 적재 + normalize 완료
- 대전(5개구) `202601~202604` 적재 + normalize 완료
- 대구/인천/광주/울산/세종 `202601~202604` 순차 적재 + normalize 완료

## 문서 작업
- 서울/경기/부산/대전/대구/인천/광주/울산/세종 커버리지 문서 생성/갱신
- 경기 문서를 시/군 통합코드 기준으로 재작성
- 대도시 통합 현황 문서 생성: `docs/METRO_COVERAGE_PRIORITY_2026-04-25.md`
- 월세 API 검증 문서 생성: `docs/APT_RENT_API_VERIFY_2026-04-25.md`

## 정리 작업
- 맵 관련 parity 리포트(.md/.json) 아카이브 이동
  - `docs/archive/map/`

## 상세 페이지 UI/토글 동기화 작업 추가
- 대상: `/complexes/[id]` (검증 기준 `18742`)
- 요구사항 반영: 매매/전세/월세 토글 상태를 URL `dealType`로 고정
  - 값: `sale | jeonse | wolse`
  - 기본값/정규화: 미지정/이상값은 `sale`
- 적용 파일: `app/complexes/[id]/page.tsx`, `components/ComplexDealTypePanel.tsx`
  - `searchParams`에 `dealType` 추가
  - `buildTabHref`, `buildTrendHref`, `buildRawHref` 모두 `dealType` 반영
  - 탭 이동/기간(3m,6m,1y,all)/평형 변경 시 `dealType` 유지
  - `ComplexDealTypePanel` 내부 `useState` 제거, URL(querystring) 기반으로 상태 제어
- 결과
  - `price/listings/info` 모든 서브페이지에서 동일 동작
  - 새로고침/공유 링크/브라우저 이동 시 토글 상태 유지
  - 전세/월세/매매 카드 수치가 기간+평형 필터 조합에 맞게 표시됨

## 추가 실행 (2026-04-26)
- 사용자 요청에 따라 `docs/METRO_RENT_COVERAGE_PRIORITY_2026-04-25.md`의 미적용 도시(부산/대구/인천/광주/대전/울산/세종) 순차 처리
- 실행 명령: `scripts/ingest-molit-rent.mjs --startYmd=202601 --endYmd=202604` (도시별 지역코드 지정)
- 결과 요약
  - 부산(16): API `17,912건` / DB `raw+normalized 16,925건`
  - 대구(9): API `10,699건` / DB `raw+normalized 10,173건`
  - 인천(10): API `20,425건` / DB `raw+normalized 19,321건`
  - 광주(5): API `7,254건` / DB `raw+normalized 6,767건`
  - 대전(5): API `8,446건` / DB `raw+normalized 7,710건`
  - 울산(5): API `3,835건` / DB `raw+normalized 3,645건`
  - 세종(1): API `5,146건` / DB `raw+normalized 4,872건`
- 문서 반영 완료
  - `docs/METRO_RENT_COVERAGE_PRIORITY_2026-04-25.md`
  - `docs/*_RENT_COVERAGE_PRIORITY_2026-04-25.md` (부산/대구/인천/광주/대전/울산/세종)

## 연립·다세대 매매 전용 페이지 1차 구현 (2026-04-26)
- 사용자 요청: 아파트 `/complexes/[id]` 구조 기준으로 연립·다세대 매매 전용 서브페이지 동일 구성
- 파일 단위 실행 완료
  - 스키마: `sql/011_rowhouse_trade_schema.sql`
  - ingest: `scripts/ingest-molit-rowhouse-trade.mjs`
  - npm script: `package.json` (`ingest:molit:rowhouse:sale`, `ingest:molit:rowhouse:sale:dry`)
  - 조회 라이브러리: `lib/rowhouses.ts`
  - 페이지: `app/rowhouses/[id]/page.tsx` (아파트 페이지 구조 복제)
  - API: `app/api/rowhouses/[id]/route.ts`
  - 계획 문서: `docs/ROWHOUSE_SALE_IMPLEMENTATION_PLAN_2026-04-26.md`
- 빌드 검증: `npm run build` 통과 (`/rowhouses/[id]`, `/api/rowhouses/[id]` 라우트 생성 확인)

## 연립·다세대 매매 파일럿 테스트 결과 반영 (2026-04-26)
- 실행
  - `node scripts/run-sql.mjs sql/011_rowhouse_trade_schema.sql`
  - `npm run ingest:molit:rowhouse:sale:dry -- --regions=11110 --dealYmd=202604`
  - `npm run ingest:molit:rowhouse:sale -- --regions=11110 --dealYmd=202604`
- 결과
  - 서울 종로(11110) 202604: fetched `15` / DB raw `15` / normalized `15`
  - 테스트 단지 ID: `177587` (동남레저타운나동)
- 검증
  - URL 조합: `tab(price/listings/info) × trend(3m/6m/1y/all) × area(all/82.39)` 총 `24`개 모두 `HTTP 200`
  - UI 기준: 토글 active 정상, 매매 실데이터 노출, 전세/월세 빈 데이터 문구 정상
- 문서 반영
  - `docs/ROWHOUSE_SALE_IMPLEMENTATION_PLAN_2026-04-26.md`
  - `docs/METRO_ROWHOUSE_SALE_COVERAGE_PRIORITY_2026-04-25.md`

## 연립·다세대 매매 전 지역 순차 실행 (2026-04-26)
- 요청: `docs/METRO_ROWHOUSE_SALE_COVERAGE_PRIORITY_2026-04-25.md` 기준 모든 지역을 2026-01-01~2026-04-26 범위로 순차 처리
- 실행: `scripts/ingest-molit-rowhouse-trade.mjs --startYmd=202601 --endYmd=202604` (도시별 지역코드 순차 실행)
- 결과(도시별)
  - 서울(25): API `12,044` / DB `raw 11,734`, `normalized 11,734`
  - 부산(16): API `1,453` / DB `raw 1,387`, `normalized 1,387`
  - 대구(9): API `325` / DB `raw 323`, `normalized 323`
  - 인천(10): API `3,148` / DB `raw 3,090`, `normalized 3,090`
  - 광주(5): API `188` / DB `raw 129`, `normalized 129`
  - 대전(5): API `429` / DB `raw 423`, `normalized 423`
  - 울산(5): API `280` / DB `raw 269`, `normalized 269`
  - 세종(1): API `51` / DB `raw 35`, `normalized 35`
- 문서 반영
  - `docs/METRO_ROWHOUSE_SALE_COVERAGE_PRIORITY_2026-04-25.md` 통합 요약/로그/다음 작업 업데이트
  - `docs/GYEONGGI_ROWHOUSE_SALE_COVERAGE_PRIORITY_2026-04-25.md` 신설
  - 도시별 연립·다세대 매매 커버리지 문서 생성

## 문서 체계 개편 (전국 통합 3종) (2026-04-26)
- 신규 전국 통합 문서 생성
  - `docs/NATIONAL_APT_SALE_COVERAGE_PRIORITY_2026-04-26.md`
  - `docs/NATIONAL_APT_RENT_COVERAGE_PRIORITY_2026-04-26.md`
  - `docs/NATIONAL_ROWHOUSE_SALE_COVERAGE_PRIORITY_2026-04-26.md`
- 레거시 문서 전환
  - `docs/METRO_SALE_COVERAGE_PRIORITY_2026-04-25.md` → Legacy 인덱스
  - `docs/METRO_RENT_COVERAGE_PRIORITY_2026-04-25.md` → Legacy 인덱스
  - `docs/METRO_ROWHOUSE_SALE_COVERAGE_PRIORITY_2026-04-25.md` → Legacy 인덱스
- 방향
  - 관리 기준을 대도시 묶음에서 전국 통합(서울/경기/부산/대구/인천/광주/대전/울산/세종)으로 변경

## 경기 아파트 전월세 작업 진행 (2026-04-26)
- 요청: `docs/NATIONAL_APT_RENT_COVERAGE_PRIORITY_2026-04-26.md` 기준 경기 작업
- 실행
  - 실적재: `scripts/ingest-molit-rent.mjs --regions=<경기 47코드> --startYmd=202601 --endYmd=202604`
  - 중단: `project size limit (512 MB) exceeded`
- 결과
  - 실적재 완료: 13/47 코드, DB `raw 25,689 / normalized 25,689`
  - 잔여 34코드는 dry-run 수행: `totalSeen 75,862`
- 문서 반영
  - `docs/NATIONAL_APT_RENT_COVERAGE_PRIORITY_2026-04-26.md` 경기 상태를 `진행중`으로 업데이트

## 참고
- 오늘 표준 노트 파일명 형식 유지: `YYYY-MM-DD-conversation.md`
