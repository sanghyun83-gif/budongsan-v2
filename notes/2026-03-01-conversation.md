# Conversation Log — 2026-03-01 (Merged)

> 본 문서는 중복 저장된 2026-03-01 대화 노트를 시간 순서로 통합한 파일입니다.

---

## Source: `notes/2026-03-01-conversation.md`

﻿# Conversation Notes - 2026-03-01

## 오늘 진행 내용
1. 런칭 후속 작업에서 `CRON_SECRET` 설정/재배포/cron API 검증 진행
2. `vercel.json` 배포 실패 원인 확인 및 수정
   - 원인: BOM 포함으로 `Invalid vercel.json`
   - 조치: BOM 제거 후 정상 배포 가능 상태로 수정
3. 프로덕션 cron endpoint 검증 성공
   - `GET /api/cron/normalize` 응답: `ok: true`
4. Hydration mismatch 이슈 수정
   - `Explorer`의 초기 `updatedAt`를 `new Date()` 기반에서 `null` 기반으로 변경
5. Next Phase(MVP-3) Day 1-2 착수
   - `scripts/ingest-molit.mjs` 추가
   - `package.json`에 ingest 명령 추가
   - `docs/DATA_COVERAGE_RUNBOOK.md`, `docs/PHASE3_EXECUTION_LOG.md` 추가
6. 데이터 적재 검증
   - dry-run(강남 3개월): fetched/normalized 확인
   - 실제 적재(강남 3개월, 200건 제한): raw 197, normalized 200

## 현재 상태
1. cron 보안/호출은 동작 확인 완료
2. MVP-3 데이터 커버리지 확장 스크립트 준비 완료
3. 서울권 대량 적재는 장시간 작업이라 사용자 요청으로 중단

## 내일 이어서 할 작업
1. 서울 핵심권역 배치 적재 실행
   - 권장: 지역을 나눠 배치 실행(타임아웃 방지)
2. 적재 후 DB 커버리지 집계 확인
   - complex 수, normalized 수, 지역별 거래 건수
3. 검색 0건 비율 확인
4. 다음 단계: `/api/search` 정렬(sort) 구현 착수

## 참고 명령
```bash
# 빠른 배치(권장)
npm run ingest:molit -- --regions=11680,11650,11710,11440,11200 --months=2 --maxPerRegion=600

# 기본 서울 3개월
npm run ingest:molit:seoul3m
```

---

## Source: `notes/2026-03-01_conversation.md`

﻿# Conversation Notes (2026-03-01)

## 목표
- `budongsan-v2`를 MVP 기준으로 빠르게 런칭 가능한 상태로 고도화.
- 카카오 지도 + 공공데이터(국토부 실거래) 연동 기반에서 검색/지도/상세 흐름 안정화.

## 오늘 핵심 진행 내용
- Vercel, Neon, 환경변수(`DATABASE_URL`, `CRON_SECRET`) 설정 및 점검 진행.
- DB 마이그레이션/시드/정규화 흐름 정리:
  - `sql/001_init.sql`
  - `sql/002_seed.sql`
  - `sql/003_normalize_from_raw.sql`
- API/화면 검증:
  - `/api/search`
  - `/api/map/complexes`
  - `/api/complexes/:id`
  - `/api/complexes/:id/deals`
- 에러/품질 이슈 대응:
  - Hydration mismatch(시간 문자열 렌더 차이) 이슈 확인/보완.
  - `exact_only` boolean 파싱 버그(문자열 `false`가 true로 해석) 수정.
- 문서 체계 확장:
  - `docs/IMPLEMENTATION_PLAN.md`
  - `docs/LAUNCH_MINIMUM_CHECKLIST.md`
  - `docs/NEXT_PHASE_MVP3_PLAN.md`
  - `docs/PHASE3_EXECUTION_LOG.md`
  - `docs/LOCATION_ACCURACY_PHASE_PLAN.md`

## 주요 진단 결론
- “리스트-맵 싱크 로직” 자체보다, **좌표 품질**이 현재 체감 문제의 핵심.
- 현재 다수 데이터가 `approx`(근사 좌표)라 주소/포인트 체감 불일치가 발생.
- 초기 소량 데이터 시기보다 대량 적재 이후 mismatch 체감이 커진 원인도 동일.

## 합의된 우선순위
1. 위치 정확도 개선(데이터 파이프라인)
2. 정렬/랭킹 + 탐색 UX 안정화
3. 성능/인덱스 최적화
4. 운영 자동화/런칭 게이트 완료

## 다음 작업(Next)
- 지오코딩 백필 파이프라인으로 `approx -> exact` 전환율 향상.
- `exact ratio` KPI 운영(예: 80% 이상 목표).
- 프로덕션 점검 루틴 고정:
  - cron normalize 200
  - data freshness 확인
  - 검색→지도→상세 회귀 테스트(모바일/데스크탑)

## 메모
- 사용자 요청: 문서는 한글 우선, 기술 키워드만 영문 혼용.
- 사용자 요청: “근사 위치” 뱃지보다 근본 원인(좌표 정확도) 해결 우선.

---

## Source: `notes/2026-03-01_conversation_part2.md`

﻿# Conversation Notes (2026-03-01, Part 2)

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
