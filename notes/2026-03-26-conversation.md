# 2026-03-26 Conversation Log

## 요청
- 허브 검색 UX 불편(지도 바운드 강결합) 문제에 대한 전수조사 및 상세 보고서 생성
- Phase 1 코드 적용:
  - scope 분리 (`global|map`)
  - 자동 재검색 제거
  - `이 지도에서 검색` 버튼 추가
- 보고서 체크리스트에 방금 작업한 항목 체크 반영
- 대화 로그를 notes 폴더에 저장

## 수행 내용
1. 전수조사/비교 보고서 생성
- 파일: `docs/SALJIP_HUB_SEARCH_UX_BENCHMARK_REPORT_2026-03-26.md`
- 내용: 현행 코드 진단, top-tier 패턴 비교, 갭 분석, Phase 1~3 실행안, KPI

2. Phase 1 코드 반영
- 파일: `components/Explorer.tsx`
- 반영:
  - `searchScope` 상태 추가 (`global|map`, 기본 `global`)
  - 지도 pan/zoom 자동 재검색 제거
  - 지도 변경 시 `이 지도에서 검색` 버튼 노출
  - `/api/search`, `/api/hub/recommendations` 요청에 `scope` 반영
  - `scope=map`일 때만 bbox 전달
  - 결과 헤더에 검색 범위 표시

3. 검증
- `npm run lint` 통과

4. 문서 체크 반영
- 파일: `docs/SALJIP_HUB_SEARCH_UX_BENCHMARK_REPORT_2026-03-26.md`
- 반영:
  - Phase 1 항목 체크 완료
  - 실행 체크(2026-03-26) 섹션 추가

## 저장 경로
- `notes/2026-03-26-conversation.md`
