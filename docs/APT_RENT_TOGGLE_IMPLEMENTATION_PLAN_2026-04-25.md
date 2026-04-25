# APT_RENT_TOGGLE_IMPLEMENTATION_PLAN_2026-04-25

## 목표
- 단지 상세 화면에서 거래유형 토글 UI를 `매매 / 전세 / 월세`로 제공
- 토글 선택값에 따라 데이터/요약/리스트를 분기 렌더
- 전월세 API는 검증 완료 URL 사용
  - `https://apis.data.go.kr/1613000/RTMSDataSvcAptRent/getRTMSDataSvcAptRent`

---

## 구현 범위(파일별)

## 1) UI 컴포넌트 추가 (클라이언트)
### 파일
- `components/DealTypeToggle.tsx` (신규)

### 작업
- 토글 버튼 3개 렌더
  - `매매`, `전세`, `월세`
- props
  - `value: "매매" | "전세" | "월세"`
  - `onChange: (next) => void`
- 클래스 구조 고정
  - wrapper: `.deal-type-toggles`
  - 버튼: `.toggle-btn`
  - 활성 버튼: `.toggle-btn.active`

---

## 2) 스타일 추가
### 파일
- `app/globals.css`

### 작업
- `.deal-type-toggles`, `.toggle-btn`, `.toggle-btn.active` 스타일 추가
- 기존 버튼 스타일과 충돌 없는지 확인

---

## 3) 상세 페이지 렌더 분리
### 파일
- `app/complexes/[id]/page.tsx`
- `components/ComplexDealsPanel.tsx` (신규, 클라이언트)

### 작업
- 서버 컴포넌트(`page.tsx`)에서는 초기 데이터만 주입
- 클라이언트 패널 컴포넌트에서
  - 토글 상태 관리 (`매매` 기본)
  - 토글별 리스트/요약 렌더
- 기존 “전세/월세 준비 중” 영역 제거 후 실제 데이터 연결

---

## 4) API 응답/조회 확장
### 파일
- `lib/api/molit.ts`
- `app/api/deals/route.ts` (또는 거래 API 실제 사용 라우트)
- `lib/types.ts`

### 작업
- 전월세 endpoint 상수 추가
  - `APT_RENT_ENDPOINT`
- 전월세 fetch 함수 추가
  - `fetchRent(regionCode, dealYmd)`
- 타입 추가
  - `dealType: "sale" | "jeonse" | "wolse"`
  - 전월세 필드: `depositManwon`, `monthlyRentManwon`
- API 쿼리 파라미터 확장
  - `dealType=sale|jeonse|wolse|all`

---

## 5) 인제스트 분리(권장)
### 파일
- `scripts/ingest-molit-rent.mjs` (신규)
- `package.json`

### 작업
- 매매 ingest와 분리해 전월세 ingest 스크립트 신설
- npm script 추가
  - `ingest:molit:rent`
  - `ingest:molit:rent:dry`
- 기존 ingest 구조(병렬/배치/재시도) 재사용

---

## 6) DB 스키마/정규화
### 파일
- `sql/010_rent_schema.sql` (신규)
- `sql/011_normalize_rent_incremental.sql` (신규)
- `app/api/cron/normalize/route.ts` (확장 또는 별도 cron)

### 작업
- raw/normalized 전월세 테이블 추가
  - `deal_rent_raw`
  - `deal_rent_normalized`
- 정규화 규칙
  - `monthly_rent_manwon = 0` => 전세
  - `monthly_rent_manwon > 0` => 월세
- 증분 워터마크 키 추가
  - `normalize_rent_last_raw_id`

---

## 7) 문서/운영 반영
### 파일
- `docs/APT_RENT_API_VERIFY_2026-04-25.md`
- `docs/DAILY_NORMALIZE_RUNBOOK.md`

### 작업
- 전월세 endpoint/실행 명령/장애 대응 업데이트
- cron 실행 예시에 rent normalize 추가

---

## 단계별 실행 순서
1. 토글 UI 컴포넌트 + 스타일 반영
2. 클라이언트 패널 분리 및 매매 데이터 연동 유지
3. API 타입/쿼리 확장 (dealType)
4. 전월세 fetch 함수 추가
5. DB 스키마 + normalize SQL 추가
6. 전월세 ingest 스크립트 추가
7. 문서/런북 갱신

---

## 검증 체크리스트
- [ ] 토글 클릭 시 active 상태 정상 변경
- [ ] `dealType=sale` 기존 결과와 동일
- [ ] `dealType=jeonse|wolse` 데이터 반환 확인
- [ ] 월세/전세 분류 규칙 정확성 확인
- [ ] normalize 재실행 시 중복 적재 없음
- [ ] 단지 상세 페이지에서 토글별 요약/리스트 정상 표시
