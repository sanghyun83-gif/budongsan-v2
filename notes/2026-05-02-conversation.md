# 2026-05-02 작업 기록

## 요청 요약
- `API_USAGE.md` 기반으로 오피스텔/빌라(연립다세대) 매매·전세·월세 API 정상작동/속도 확인
- 제공된 API 키로 실측 테스트
- 빌라 페이지를 sootja API로 대체 진행
- 검색 UI/엔진 통합: 아파트+빌라+오피스텔 단일 검색 결과
- 중복 단지 묶기 + 최근 매매값 표시
- 클릭 404 이슈 수정
- 검색 첫 입력 즉시 반영(엔터 없이)
- 검색 prewarm 자동화
- prod(`saljip.kr`) 0건 이슈 원인 분석/수정
- 커밋/푸시 수행

## 주요 확인 결과
- `https://sootja.kr/api/openapi.json` 접근 정상(200)
- 인증 없는 데이터 엔드포인트는 401 정상
- 유효 API 키로 오피스텔/다세대 trade/rent/search 모두 200
- 일반 조회 약 0.35~0.42s, search 약 0.5~0.73s(로컬 측정 기준)

## 구현/수정 내역

### 1) 빌라 데이터 소스 전환
- 파일: `lib/rowhouses.ts`
- 변경:
  - `getRowhouseSummaryById`, `getRowhouseDealsById`, `getRowhouseTrendDealsById`를 sootja API 우선 조회
  - DB는 `id -> aptName/legalDong/regionCode` 메타 매핑 및 fallback 용도 유지

### 2) 빌라 검색 API 추가
- 파일: `app/api/rowhouses/search/route.ts`
- 엔드포인트: `GET /api/rowhouses/search?q=...`
- 기능:
  - sootja `dasaedae/trade/search` 호출
  - 응답 정규화 + `latencyMs` 반환
  - 가능 시 DB 매칭으로 `rowhouseId` 보강

### 3) 검색 UI 연결/조정
- 파일: `components/SearchPanel.tsx`, `app/search/page.tsx`, `components/SearchResultsPage.tsx`, `components/HeaderSearch.tsx`
- 변경:
  - 빌라 검색 연결 및 기존 검색 페이지와 통합
  - 엔터 없이 첫 입력 즉시 반영되도록 이벤트 동기화(`saljip:search-q`)
  - 결과 카드에 타입 라벨(아파트/빌라/오피스텔) 표시

### 4) 통합 검색 엔진 확장
- 파일: `app/api/search/route.ts`
- 변경:
  - Neon(아파트) + sootja(빌라/오피스텔) 동시 조회 후 병합
  - `name + dong` 정규화 키로 중복 제거
  - 최신 거래일 기준 1건 유지
  - `detail_href` 제공
  - 외부 상세 링크: `/rowhouses/external?...`

### 5) 외부 상세 페이지 추가
- 파일: `app/rowhouses/external/page.tsx`
- 기능:
  - DB 매핑이 없는 빌라/오피스텔도 sootja 직접 조회로 상세 표시

### 6) 404/클릭 이슈 해결
- 원인:
  - 문자열 id(`rowhouse:...`)가 `/complexes/...`로 연결되며 404
- 해결:
  - `detail_href` 우선 사용
  - 아파트만 `/complexes/{id}` 기본 링크 허용
  - 빌라/오피스텔은 매핑 실패 시 external 링크 사용

### 7) prewarm 구현
- 파일: `app/api/ops/prewarm/route.ts`
  - DB warm + 인기 키워드 `/api/search` 호출
- 파일: `components/RouteChrome.tsx`
  - 사용자 진입 시 세션당 1회 자동 prewarm 호출
- 파일: `app/api/search/route.ts`
  - 최초 요청 시 auto-prewarm 트리거(재귀 방지 `_warm=1`)

### 8) fallback 전략
- 초기: `더가온` 하드코드 fallback 추가
- 이후 개선:
  - 하드코드 제거
  - 일반 fallback 도입(0건일 때만):
    - 원문/공백제거/첫토큰 최대 3개 쿼리 재시도
    - villa/officetel 병렬 호출
    - 중복제거 + 최신값 유지

### 9) prod 이슈 분석
- `saljip.kr`에서 `SOOTJA_API_ERROR Invalid API key` 확인
- 원인 가능성:
  - 배포 env 값 형식 문제(`API_KEY=...` 문자열 자체 저장, 따옴표 포함 등)
- 대응 코드:
  - sootja 키 정규화 함수 추가(공백/`key=` 접두/따옴표 제거)
  - 적용 파일:
    - `app/api/search/route.ts`
    - `app/api/rowhouses/search/route.ts`
    - `lib/rowhouses.ts`

## 성능 측정 요약
- `/api/search?q=금강프라임빌...` 로컬:
  - cold: 약 2158ms
  - warm: 약 15~38ms
- 단계별(더가온 테스트):
  - Neon 쿼리 warm 약 201ms
  - sootja villa 약 342ms
  - sootja officetel 약 599ms
  - 전체 warm 약 551~753ms(초기 cold spike 존재)

## 커밋/푸시
- `fd5d5eb` feat(search): unify apt/villa/officetel search with sootja integration and prewarm
- `7f99acb` chore: sync docs and asset changes
- `573d53b` fix(search): add generic fallback strategy for empty merged results

## 남은 운영 체크
1. 배포 환경변수 검증
   - `SOOTJA_API_KEY`
   - `API_KEY`(호환)
   - `SOOTJA_API_BASE_URL=https://sootja.kr/api`
2. 재배포 후 점검
   - `/api/rowhouses/search?q=더가온`
   - `/api/search?q=더가온&lite=true`
3. 필요 시 `fallbackUsed` 지표 추가 및 모니터링
