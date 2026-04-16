# Commission Upgrade Tickets (살집 맞춤형)

## Phase 1 — 라우팅/인덱싱 정리 (mock 분리, 실서비스 경로 준비)

### Ticket 1.1 `/commission` 신규 페이지 스캐폴드
- **파일**
  - `app/commission/page.tsx` (신규)
  - `components/commission/CommissionPage.tsx` (신규)
- **TODO**
  - React 기반 최종 페이지 엔트리 생성
  - 현재 `/commission-react`의 골격을 `/commission`로 이관 시작

### Ticket 1.2 `/mock/commission` noindex 처리
- **파일**
  - `app/mock/commission/route.ts`
- **TODO**
  - `<meta name="robots" content="noindex,nofollow">` 주입
  - canonical 제거 또는 self-canonical 금지

### Ticket 1.3 헤더 링크 운영 분리
- **파일**
  - `components/GlobalHeader.tsx`
- **TODO**
  - 운영 메뉴는 `/commission` 링크
  - `/mock/commission` 링크는 dev/관리용으로 분리(조건부 노출)

---

## Phase 2 — SEO 메타/구조화데이터 구축

### Ticket 2.1 페이지 메타 고도화
- **파일**
  - `app/commission/page.tsx`
  - `lib/seo/metadata.ts`
- **TODO**
  - title/description/OG/twitter 문구 SEO형으로 작성
  - canonical `/commission` 지정

### Ticket 2.2 JSON-LD 삽입
- **파일**
  - `components/commission/CommissionSeoJsonLd.tsx` (신규)
  - `app/commission/page.tsx`
- **TODO**
  - `FAQPage`, `BreadcrumbList`, `WebApplication` 스키마 삽입

### Ticket 2.3 FAQ 콘텐츠 초안
- **파일**
  - `components/commission/CommissionFaq.tsx` (신규)
- **TODO**
  - 6~10개 FAQ 문항/답변 작성
  - 계산기 본문 하단에 배치

---

## Phase 3 — 레이아웃/디자인 시스템 전환

### Ticket 3.1 페이지 레이아웃 재구성 (2컬럼 + 모바일)
- **파일**
  - `components/commission/CommissionPage.tsx`
  - `app/globals.css` (또는 `components/commission/commission.css` 신규)
- **TODO**
  - 좌측 입력 / 우측 sticky 결과
  - 모바일 단일 컬럼 + 계산 CTA 고정

### Ticket 3.2 UI 컴포넌트 분리
- **파일**
  - `components/commission/CommissionForm.tsx` (신규)
  - `components/commission/CommissionResultSummary.tsx` (신규)
  - `components/commission/CommissionResultTable.tsx` (신규)
  - `components/commission/CommissionBasis.tsx` (신규)
- **TODO**
  - 현재 단일 컴포넌트 분해
  - 재사용 가능한 props 구조로 변경

### Ticket 3.3 참고 요율표/탭 영역 정식 컴포넌트화
- **파일**
  - `components/commission/CommissionIntroTabs.tsx` (신규)
  - `components/commission/CommissionRateTable.tsx` (신규)
- **TODO**
  - mock HTML 복붙 구조 제거
  - 접근성 있는 탭/표 컴포넌트 구현

---

## Phase 4 — 계산엔진/도메인 모델 강화

### Ticket 4.1 계산엔진 규칙 명세 분리
- **파일**
  - `lib/commission/calc.ts`
  - `lib/commission/rules.ts` (신규)
  - `lib/commission/types.ts` (신규)
- **TODO**
  - 룰 테이블(주택/오피스텔/주택외/분양권/월세환산) 분리
  - 타입 안정성 강화

### Ticket 4.2 계산 근거 텍스트 고도화
- **파일**
  - `lib/commission/explain.ts` (신규)
  - `lib/commission/calc.ts`
- **TODO**
  - 구간/요율/한도 적용 근거를 사용자 친화 문장으로 생성
  - 결과표 row 설명 일관화

### Ticket 4.3 API/클라이언트 응답 포맷 통일
- **파일**
  - `app/api/commission/calc/route.ts`
- **TODO**
  - 결과 스키마 고정
  - 에러 코드/메시지 표준화

---

## Phase 5 — UX 기능 (기록/공유/비교)

### Ticket 5.1 기록 기능(로컬 저장)
- **파일**
  - `lib/commission/history.ts` (신규)
  - `components/commission/CommissionHistory.tsx` (신규)
- **TODO**
  - `record` 기능 React 방식 복원
  - 최근 계산 N개 저장/복원

### Ticket 5.2 비교(추가) 기능
- **파일**
  - `components/commission/CommissionResultTable.tsx`
  - `components/commission/CommissionPage.tsx`
- **TODO**
  - add 모드 누적 비교
  - 행 삭제/전체 초기화

### Ticket 5.3 공유 URL 기능
- **파일**
  - `lib/commission/share.ts` (신규)
  - `components/commission/CommissionShare.tsx` (신규)
- **TODO**
  - 입력값 쿼리 직렬화/복원
  - URL 복사 토스트 처리

---

## Phase 6 — 접근성/문구/신뢰도 강화

### Ticket 6.1 A11y 개선
- **파일**
  - `components/commission/*`
- **TODO**
  - 중복 id 제거
  - label/aria-live/keyboard tab 완비
  - 표 caption/scope 반영

### Ticket 6.2 법적 고지/기준일/출처
- **파일**
  - `components/commission/CommissionLegalNotice.tsx` (신규)
- **TODO**
  - “참고용” 고지
  - 서울 기준/지역 조례 차이 명시
  - 출처 링크 섹션 정리

### Ticket 6.3 SEO 본문 카피 업그레이드
- **파일**
  - `components/commission/CommissionArticle.tsx` (신규)
- **TODO**
  - 검색의도형 설명문(800~1500자)
  - 주요 키워드 자연 포함

---

## Phase 7 — QA/배포/전환

### Ticket 7.1 parity 테스트 유지·확장
- **파일**
  - `scripts/commission-parity-smoke.mjs`
- **TODO**
  - 케이스 추가(경계값, 커스텀 요율, 월세환산)
  - fail 리포트 상세화

### Ticket 7.2 E2E 스모크
- **파일**
  - `scripts/commission-smoke.mjs` (신규)
- **TODO**
  - `/commission` 핵심 플로우 자동검증
  - 계산/기록/공유 동작 확인

### Ticket 7.3 최종 스위치
- **파일**
  - `components/GlobalHeader.tsx`
  - 관련 docs/notes
- **TODO**
  - 공식 링크를 `/commission`로 전환
  - `/mock/commission` 내부 테스트 전용으로 축소

---

## 우선순위(추천)
1. **P0**: Phase 1~2 (경로/SEO 기반)
2. **P1**: Phase 3~4 (UI 완성 + 정확한 계산)
3. **P2**: Phase 5~6 (기능/신뢰도)
4. **P3**: Phase 7 (자동화/운영 전환)
