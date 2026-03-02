# Conversation Notes (2026-03-01, Part 2)

## 사용자 요청 요지
- Top tier 품질 관점에서 현재 우선순위를 재정렬
- UX보다 먼저 데이터 정확도/검증 운영(P0) 실행
- 즉시 코드 반영 및 실행

## 핵심 질문
- geocoding 백필에 Kakao API 연동이 필요한가?
- 맵 포인터 클릭/연동이 안 되는 이유는?
- MVP라도 top tier 품질로 가려면 무엇부터 해야 하나?

## 진단 결과
1. 포인터 클릭 무반응 원인
- `components/HomeMap.tsx`에서 마커 클릭 이벤트가 미구현
- 마커 생성만 있고 `kakao.maps.event.addListener(marker, "click", ...)` 없음

2. 주소-맵 체감 불일치 원인
- ingest에서 실제 지오코딩이 아니라 region center + hash offset 근사 좌표 사용
- 파일: `scripts/ingest-molit.mjs` (lat/lng 생성 구간)
- 결과적으로 `location_source='approx'` 비중이 높아 실제 위치와 체감 불일치 발생

3. 검색/지도 API 싱크
- `qa:parity` 기준 케이스 PASS
- 즉, 리스트-맵 결과셋 규칙은 대체로 일치
- 핵심 문제는 좌표 정확도와 인터랙션

## 이번 턴 구현 내용 (비UX P0 우선)
1. SQL 추가
- `sql/006_geocode_backfill.sql`
  - `complex`에 geocode 메타데이터 컬럼 추가
  - `geocode_backfill_queue` 생성

2. 스크립트 추가
- `scripts/enqueue-geocode.mjs`
  - approx 중심 큐 적재/갱신
- `scripts/backfill-geocode-kakao.mjs`
  - Kakao Local geocoding
  - reverse 검증
  - confidence 기준 실패/재시도/영구실패 분기
  - 성공 시 `location_source='exact'` 전환

3. KPI/운영 API 추가
- `app/api/ops/location-quality/route.ts`
  - `exact_ratio`, queue 상태, gate 여부(`precisionMapEnabled`) 반환

4. 스크립트 등록
- `package.json`
  - `db:geocode-schema`
  - `geocode:enqueue`
  - `geocode:backfill`

5. 문서 갱신
- `docs/LOCATION_ACCURACY_PHASE_PLAN.md`
  - 비UX P0 우선순위로 재정리

## 실행 결과
- `npm run db:geocode-schema` 성공
- `npm run geocode:enqueue` 성공 (queuedOrUpdated: 966)
- `npm run geocode:backfill` 실패: `KAKAO_REST_API_KEY` 미설정
- `GET /api/ops/location-quality` 성공
  - totalComplexes: 966
  - exactComplexes: 0
  - approxComplexes: 966
  - exactRatio: 0
  - precisionMapEnabled: false
  - queue.pending: 966

## 현재 결론
- 지금 단계에서 UX보다 먼저 데이터 정확도 파이프라인 착수는 맞는 선택
- 단, 실제 전환을 위해 `KAKAO_REST_API_KEY` 설정이 즉시 필요

## 다음 즉시 액션
1. `.env.local` + Vercel에 `KAKAO_REST_API_KEY` 추가
2. `npm run geocode:backfill` 실행
3. `/api/ops/location-quality`에서 `exactRatio` 상승 추적
4. 이후 UX(P1): 마커 클릭 -> 리스트 하이라이트/스크롤 연동
