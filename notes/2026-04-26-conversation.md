# 2026-04-26 Conversation Log

## 오늘 작업 요약
- `/complexes/[id]` 토글 상태(`dealType`) URL 동기화 반영 및 전 탭(price/listings/info) 적용 확인
- 빌드 타입 에러 수정 후 배포 반영
  - `components/ComplexDealTypePanel.tsx` 유니온 타입 분기 수정
- 아파트 전월세 커버리지(부산/대구/인천/광주/대전/울산/세종) 순차 ingest + normalize 완료 및 문서 반영
- 연립·다세대(빌라) 매매 파이프라인 1차 구축
  - `sql/011_rowhouse_trade_schema.sql`
  - `scripts/ingest-molit-rowhouse-trade.mjs`
  - `lib/rowhouses.ts`
  - `app/rowhouses/[id]/page.tsx`
  - `app/api/rowhouses/[id]/route.ts`
- 서울 파일럿(11110, 202604) 및 `/rowhouses/177587` 조합 검증(탭/기간/평형) 수행
- 전국(서울+7대도시+세종) 연립·다세대 매매 202601~202604 순차 적재 완료, 지역별 문서 생성
- 문서 체계 개편
  - 전국 통합 3종 문서 신설
    - `docs/NATIONAL_APT_SALE_COVERAGE_PRIORITY_2026-04-26.md`
    - `docs/NATIONAL_APT_RENT_COVERAGE_PRIORITY_2026-04-26.md`
    - `docs/NATIONAL_ROWHOUSE_SALE_COVERAGE_PRIORITY_2026-04-26.md`
  - `METRO_*` 문서는 `docs/archive/metro/`로 이동
- 경기 아파트 전월세 작업 시도
  - 진행 중 DB 용량 제한(512MB)으로 중단
  - 실적재 13/47 코드 완료, 잔여 34코드 dry-run 확인
- 홈 상단 SEO 문구는 요청대로 **문구만** 변경
  - 파일: `components/HeaderSearch.tsx`

## 파일명 규칙
- `YYYY-MM-DD-conversation.md` 통일 적용
