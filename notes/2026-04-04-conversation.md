# 2026-04-04 Conversation Log

## 요청/진행 요약
- `docs/SALJIP_TOP_TIER1_FULL_BENCHMARK_REPORT_2026-03-30.md` 인코딩 깨짐 구간 복구 및 문맥 정리.
- 문서 기준으로 현재 스코프 재정의:
  - 문의 채널/문의 CTA 보류
  - 핵심 플로우(검색→줌인→핀클릭→상세) 우선
  - 보류/제외 항목 명시
- 코드 반영:
  - Hub/상세 문의 CTA 비노출
  - 상세 탭 골격(`시세·실거래/매물/단지정보/이야기`) 도입
  - 매물 탭 placeholder API 계약 고정 (`GET /api/complexes/:id/listings`)
  - provider adapter 인터페이스 고정
  - `naver_land` 스캐폴드(정규화/중복제거 유틸) 추가
  - fixture 기반 검증 경로 추가

## 추가된 주요 파일
- `app/api/complexes/[id]/listings/route.ts`
- `components/ComplexListingsTab.tsx`
- `lib/clientPrefs.ts`
- `lib/listings/adapters.ts`
- `lib/listings/providers/naverLand.ts`
- `lib/listings/providers/fixtures/naverLand.sample.json`
- `scripts/listings-naver-fixture-smoke.mjs`
- `scripts/sync-listings-fixture-smoke-to-benchmark.mjs`
- `scripts/listings-naver-fixture-all.mjs`
- `scripts/hub-manual-smoke-report.mjs`
- `scripts/sync-manual-smoke-to-benchmark.mjs`
- `docs/SALJIP_HUB_MANUAL_SMOKE_CHECKLIST_2026-04-04.md`
- `docs/SALJIP_HUB_MANUAL_SMOKE_RESULT_TEMPLATE_2026-04-04.md`
- `docs/SALJIP_LISTINGS_ADAPTER_IMPLEMENTATION_CHECKLIST_TEMPLATE_2026-04-04.md`

## QA/문서 자동화
- 수동 스모크 결과 리포트 자동 생성 스크립트 추가.
- fixture smoke 결과를 벤치마크 문서 체크리스트에 자동 반영하는 스크립트 추가.
- one-command 실행 추가:
  - `npm run qa:listings-naver-fixture:all`

## 배포 이슈 및 해결
- Vercel 빌드 실패 로그 확인:
  - `Property 'fitRequestKey' does not exist on type 'HomeMapProps'`
- 수정:
  - `components/HomeMap.tsx`, `types/kakao.d.ts` 정합화
- 재검증:
  - `npm run lint` PASS
  - `npm run build` PASS
- 푸시 완료:
  - `main` 최신 커밋 `1d6af9d`

## 참고 커밋(오늘 진행분)
1. `feat(hub): hide inquiry CTA and simplify detail flow with tabbed detail page`
2. `feat(listings): lock API contract and add naver_land adapter scaffold with dedupe`
3. `chore(qa): add fixture smoke, benchmark sync, and one-command runners`
4. `docs(hub): update benchmark scope and add adapter/QA checklist templates`
5. `fix(map): include fitRequestKey prop in HomeMap and align kakao types`
6. `feat(listings): add env-gated naver live fetch retries and align mode/status from adapter meta`

## 추가 진행사항 (후속 세션)
- 문서 운영 원칙 확정:
  - `HYBRID_TRAFFIC`를 실행 마스터 문서로 지정
  - `TOP_TIER1`를 결정 근거 문서로 유지
- HYBRID 체크리스트 1차 동기화:
  - 맵 UX 안정화 완료 반영
  - 우선순위 큐/기준선 상태 주석 반영
- Phase 0/2 실행 기반 문서 작성:
  - `notes/traffic-baseline-2026-04-03.md`
  - `docs/SALJIP_TEXT_PAGE_PRIORITY_QUEUE_2026-04-03.md`
  - `docs/TRAFFIC_MEASUREMENT_CHECKLIST.md` (표준 이벤트 기준으로 갱신)
- 이벤트 표준 전환 코드 반영:
  - `search` -> `view_search_results`
  - `view_complex_detail` -> `detail_view`
  - `map_pin_click` 이벤트 추가
- Batch1 실무 작업표 정비:
  - `docs/SALJIP_TEXT_PAGE_BATCH1_10URL_WORKSHEET_2026-04-04.md`
  - 실존 단지 ID 기준 10 URL 재정렬/존재 확인
- 상세 페이지 SEO/내부링크 1차 반영:
  - Batch1 대상 메타/첫문단 강화
  - 관련 단지 내부링크(9개) 섹션 추가
- Phase 3/4 선행 작업:
  - `app/sitemap.ts` 분할 sitemap + URL별 lastmod 반영
  - `docs/SALJIP_BATCH1_CTR_TRACKER_2026-04-04.md` 생성
- QA 상태:
  - 여러 차례 `npm run lint`, `npm run build` 통과
