# API-Only Foundation Implementation Plan

## 목표
- DB(Neon) 없이 전국 아파트/빌라/오피스텔 실거래(매매/전세/월세) 조회를 안정적으로 제공한다.
- 기존 `external` 쿼리 URL을 규격화된 고정 URL로 전환한다.
- 기존 상세 UX(예: `/complexes/18742` 화면 구성)는 재사용하고 데이터 소스만 API로 통일한다.

---

## 범위
- 포함
  - 검색: `GET /v1/search`
  - 상세: `GET /v1/complex/records`
  - URL 규격화(결정형 stableKey)
  - SEO 전환(canonical, redirect, sitemap)
- 제외
  - DB 기반 내부 ID/중복 병합 고도화
  - 장기 보관/오프라인 분석 파이프라인

---

## 핵심 결정
1. 데이터 소스는 전면 API-only
2. 고정 URL 키는 DB 없이 재생성 가능한 **UUIDv5** 사용
3. URL은 계층형 구조 사용
   - 예: `/deallist/{sggCd}/{ptypeCode}/{stableKey}`
4. 상세 데이터는 URL 파라미터를 디코드해 실시간 API 조회

---

## URL 설계

### 경로
- `/{segment1}/{segment2}/{segment3}` 스타일 유지
- 권장: `/deallist/{sggCd}/{ptypeCode}/{stableKey}`
  - `sggCd`: 5자리 시군구 코드
  - `ptypeCode`: `A`(apartment), `V`(dasaedae), `O`(officetel)
  - `stableKey`: UUIDv5

### stableKey 생성 규칙
- 원문 입력:
  - `property_type|complex_name_norm|sggcd|umdnm_norm|jibun_norm`
- 예시 네임스페이스: `f7a1f6e9-6f85-4d53-8f41-9f3c3f6a1111` (고정)
- 동일 입력이면 동일 stableKey 재생성 가능

### 정규화 규칙
- `complex_name_norm`: 소문자 + 공백/특수문자 제거
- `umdnm_norm`: trim + 연속공백 1개 + 소문자
- `jibun_norm`: trim + 공백 제거
- 누락값은 `""` 사용

---

## API 매핑 규격

### 1) 검색(`/v1/search`)
- 입력: `q`, `page`, `page_size`
- 출력 row 필드 사용:
  - `property_type`, `complex_name`, `sggcd_list`, `umdnm_list`, `jibun_list`
- 리스트 첫 원소를 대표값으로 사용(없으면 빈값)
- 대표값으로 stableKey 생성 후 상세 URL 생성

### 2) 상세(`/v1/complex/records`)
- 입력:
  - `property_type` (`dasaedae|officetel|apartment(정책에 맞게)`)
  - `complex_name`
  - 필요 시 `sggCd`, `umdNm`, `jibun` 추가 narrowing
- 출력:
  - `trade.items`, `rent.items` 그대로 렌더(가공 최소화)

---

## 구현 단계

### Phase 1. 유틸/타입
- `lib/url-key.ts`
  - `normalizeName`, `normalizeUmd`, `normalizeJibun`
  - `makeStableKey(input)` (uuidv5)
  - `encodeRouteParams`, `decodeRouteParams`
- `lib/sootja-types.ts`
  - `/v1/search`, `/v1/complex/records` 응답 타입 정의

### Phase 2. 검색 경로 연결
- `app/api/search/route.ts` 또는 검색 패널 fetch 처리에서
  - `/v1/search` 결과를 공통 ViewModel로 변환
  - `detail_href`를 `/deallist/{sggCd}/{ptypeCode}/{stableKey}`로 생성

### Phase 3. 상세 라우트 신설
- `app/deallist/[sggCd]/[ptypeCode]/[stableKey]/page.tsx`
  - stableKey만으로는 역복원이 어렵기 때문에,
  - 검색 시 함께 전달할 최소 파라미터를 쿼리 또는 서명 토큰으로 전달
  - 또는 `stableKey` + `name` 쿼리 조합으로 상세 조회
- 화면은 기존 `/complexes/[id]` UI 컴포넌트 재사용

### Phase 4. external 정리
- 기존 `/rowhouses/external` 진입 시
  - 새 규격 URL로 301 리다이렉트
- 실패 케이스만 fallback 유지

### Phase 5. SEO
- canonical: 새 규격 URL 고정
- sitemap: 새 상세 URL만 노출
- robots/meta 검토

---

## 라우팅 파라미터 전략 (DB 없음 전제)
DB가 없으므로 상세 재조회에 필요한 최소 식별 정보를 URL 또는 토큰에 담아야 함.

### 옵션 A (권장): 서명 토큰 포함
- 경로: `/deallist/{sggCd}/{ptypeCode}/{stableKey}?t={signedPayload}`
- payload: `property_type, complex_name, umdNm, jibun`
- 장점: 위변조 방지, 상세 재조회 안정

### 옵션 B: 평문 쿼리
- `?name=...&umdNm=...&jibun=...`
- 장점: 구현 쉬움
- 단점: URL 길이/노출 증가

---

## 예외/제약
- 동일 키 충돌(동명/동코드/지번 동일)은 DB 없이 완전 해결 불가
- API 응답의 리스트 대표값 선택에 따라 URL이 바뀔 수 있음
- 따라서 canonical 고정 규칙과 리다이렉트 규칙이 중요

---

## 테스트 계획
1. 단위 테스트
- 정규화 함수 입력/출력
- stableKey 재생성 일관성
2. 통합 테스트
- 검색 결과 클릭 → 상세 URL 이동
- 상세 페이지에서 trade/rent 정상 렌더
3. 회귀 테스트
- 기존 아파트/빌라/오피스텔 검색 동작 유지

---

## 운영 체크리스트
- Vercel env
  - `SOOTJA_API_BASE_URL=https://sootja.kr/realestate`
  - `SOOTJA_API_KEY=...`
  - `URL_SIGNING_SECRET=...` (옵션 A 선택 시)
- 캐시
  - 검색/상세 route TTL 설정 (짧게 5~30초)
- 장애 대비
  - API 실패 시 사용자 안내/재시도

---

## 완료 기준 (DoD)
- 아파트/빌라/오피스텔 모두 검색이 `/v1/search` 기반으로 동작
- 상세는 `/v1/complex/records`로 매매/전세/월세를 모두 표시
- 상세 URL이 규격화되어 재진입 시 동일 결과를 재현
- external URL 의존이 기본 경로에서 제거됨
