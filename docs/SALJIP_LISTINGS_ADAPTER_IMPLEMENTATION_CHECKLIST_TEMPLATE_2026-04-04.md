# SALJIP Listings Adapter Implementation Checklist (Template)

## 목적
- Provider별 매물 연동 시 `GET /api/complexes/:id/listings` 표준 응답 계약을 깨지 않도록 구현/검수한다.
- `lib/listings/adapters.ts`의 `fetchRaw + normalizeItem` 기준으로 품질을 통일한다.

## 적용 대상
- Provider Key: `naver_land | zigbang | dabang | kb_land` (placeholder 제외)
- Adapter Contract Version: `v1`

---

## 1) 구현 기본 정보
- [ ] Provider 키 확정: `__________`
- [ ] 담당 파일: `lib/listings/providers/__________.ts` (권장)
- [ ] 연동 방식: `API / HTML 파싱 / 파트너 데이터`
- [ ] 데이터 사용 정책/약관 검토 완료
- [ ] 호출 제한/쿼터 정책 문서화

---

## 2) 필수 매핑 필드 체크 (normalize)
> 표준 타입: `ComplexListingItem`

### A. 식별/기본
- [ ] `id` (필수)
  - 규칙: provider 원본 고유값 우선, 없으면 안정적 합성키
  - 예: `${provider}:${complexId}:${rawListingId}`
- [ ] `dealType` (필수)
  - 허용값: `sale | jeonse | wolse`
- [ ] `sourceName` (권장)
  - 예: `네이버부동산`, `직방` 등

### B. 가격/조건
- [ ] `priceManwon` (매매 기준)
- [ ] `depositManwon` (전세/월세 보증금)
- [ ] `monthlyRentManwon` (월세)
- [ ] 금액 단위 통일(만원) 완료
- [ ] 숫자 파싱 실패 시 `null` 처리

### C. 물리 속성
- [ ] `areaM2` (m²)
- [ ] `floor` (정수)
- [ ] 타입 변환 실패 시 `null` 처리

### D. 시간/링크
- [ ] `listedAt` (ISO 문자열 또는 null)
- [ ] `url` (절대 URL 또는 null)

### E. 버림 규칙 (normalizeItem -> null)
- [ ] `dealType` 매핑 불가 row 버림
- [ ] 식별자 생성 불가 row 버림
- [ ] 정책 위반/차단 데이터 row 버림

---

## 3) 에러 처리 체크

### A. fetchRaw 단계
- [ ] 네트워크 오류 처리 (timeout/retry 정책)
- [ ] HTTP 4xx/5xx 분기 처리
- [ ] Provider 응답 스키마 변경 감지 로그
- [ ] rate limit(429) 대응 (백오프/중단)

### B. normalize 단계
- [ ] row 단위 예외가 전체 실패로 전파되지 않음
- [ ] 파싱 실패 row는 버리고 카운트 기록
- [ ] 주요 실패 사유 집계 로그(예: price_parse_fail)

### C. API 응답 안정성
- [ ] `/api/complexes/:id/listings`는 항상 표준 shape 유지
- [ ] 실패 시 `ok:false` + code/error 일관 유지
- [ ] 성공 시 `ok:true` + 배열/list meta 필드 보장

---

## 4) dedupe 규칙 체크

### A. dedupe key
- [ ] 기본 키: `id`
- [ ] 보조 키(권장): `dealType + price + area + floor + listedAt`

### B. dedupe 정책
- [ ] 동일 `id` 중복 시 최신 `listedAt` 우선
- [ ] `listedAt` 동률이면 URL 있는 항목 우선
- [ ] 그래도 동률이면 첫 항목 유지(안정성)

### C. 페이지/배치 간 중복
- [ ] 페이지 병합 시 dedupe 적용
- [ ] batch 재실행 시 결과 안정성(순서/개수 급변 방지)

---

## 5) 정렬/필터 정합성
- [ ] `dealType` 필터 적용 확인 (`all/sale/jeonse/wolse`)
- [ ] `propertyType=apartment` 고정 처리 확인
- [ ] `page/size` 반영 확인
- [ ] `totalCount`, `count` 정합성 확인

---

## 6) 관측성(Observability)
- [ ] provider 호출 건수/성공률 로그
- [ ] normalize 성공률 로그 (`normalized/raw`)
- [ ] dedupe 제거 건수 로그
- [ ] 장애 시 재현 가능한 최소 로그 확보

권장 로그 필드:
- `provider`, `complexId`, `page`, `size`, `rawCount`, `normalizedCount`, `dedupedCount`, `durationMs`, `errorCode`

---

## 7) QA 체크

### A. 단위 검증
- [ ] 샘플 raw 20건 normalize 스냅샷 확인
- [ ] 금액/면적/층 파싱 케이스 검증

### B. API 검증
- [ ] `GET /api/complexes/:id/listings?provider=...` 200 응답
- [ ] `ok/mode/integrationStatus/adapterKey/adapterContractVersion` 확인
- [ ] 빈 결과 시에도 shape 유지

### C. 회귀 검증
- [ ] `npm run lint` PASS
- [ ] `npm run build` PASS
- [ ] 상세 `매물` 탭 렌더링 정상

---

## 8) 릴리즈 판정
- [ ] 필수 매핑 필드 100% 충족
- [ ] 에러 처리/로그 기준 충족
- [ ] dedupe 규칙 적용 확인
- [ ] 문서 업데이트 완료

최종 판정:
- [ ] PASS
- [ ] FAIL

메모:
- `___________________________________________`

---

## 실행 기록 템플릿
- 날짜: `YYYY-MM-DD`
- Provider: `__________`
- 결과: `PASS / FAIL`
- 이슈 요약: `__________`
- 후속 작업: `__________`
