# Conversation Log — 2026-04-16

## 1) Mock Commission 대규모 모방/패치 작업

### 사용자 목표
- 원본 중개보수 페이지를 `/mock/commission`에서 최대한 강하게 모방
- 이후 단계적으로 제거/정리/살집 맞춤 업그레이드

### 진행 요약
1. **완전 모방 1차 구성**
   - `/mock/commission` 라우트 프록시 렌더 구현
   - 초기에는 `/`에서 모방 화면 노출 구조를 사용(redirect/iframe 기반)

2. **삭제 후보 정리 및 단계 패치**
   - 광고/추적/외부 위젯 제거
   - 원본 브랜드/프로모션/대형 GNB 축소
   - 외부 링크 정책 정리(정부/기관 allow, 그 외 제한)
   - 인라인 스타일 정리

3. **레거시 JS 축소 + React 전환 준비**
   - mock에서 jQuery/bootstrap/common.js/calc.js 의존 축소
   - 최소 런타임 스크립트로 탭/폼/토글 동작 유지
   - `/commission-react` 골격 도입

4. **실제 계산 엔진 연결**
   - `lib/commission/calc.ts` 추가
   - `POST /api/commission/calc` 추가
   - mock 계산 버튼을 동일 API 엔진으로 연결

5. **Parity QA 도입**
   - `scripts/commission-parity-smoke.mjs` 추가
   - `qa:commission-parity` 스크립트 추가

6. **사용자 추가 요청 반영**
   - `/` 홈 원복(검색 허브), `/mock/commission`은 서브 디렉토리 유지
   - 헤더에 `/mock/commission` 링크 추가(당시 단계)
   - Cloudflare 403 대비 fallback HTML 구축
   - fallback에 intro 탭/참고 요율표/폼/결과 블록 지속 모방
   - 계산 버튼 미동작 이슈 수정(`doTran` undefined/런타임 문법 오류 수정)
   - 월세/오피스텔 라벨 동작 버그 수정(메인 라벨만 변경하도록 보정)
   - fallback 헤더를 살집 글로벌 헤더 마크업 형태로 치환

### 핵심 파일(주요)
- `app/mock/commission/route.ts`
- `app/api/commission/calc/route.ts`
- `lib/commission/calc.ts`
- `components/CommissionReactSkeleton.tsx`
- `app/commission-react/page.tsx`
- `components/GlobalHeader.tsx`
- `components/RouteChrome.tsx`
- `app/page.tsx`
- `scripts/commission-parity-smoke.mjs`
- `notes/commission-react-migration-plan.md`

---

## 2) Commission Switch + Parity PASS 마무리

### 사용자 요청
- `docs/commission-upgrade-tickets.md` 순차 실행
- `/commission`를 `components/commission/CommissionPage.tsx`로 완전 스위치
- parity 결과 PASS까지 마무리

### 진행 요약
1. **티켓 기반 파일 확장**
   - 도메인 분리: `types/rules/explain/calc`
   - 공유/기록 유틸 추가: `share/history`
   - commission 전용 분해 컴포넌트 다수 생성

2. **`/commission` 완전 스위치**
   - `app/commission/page.tsx` → `components/commission/CommissionPage.tsx`

3. **parity 실패 원인 분석 및 수정**
   - hydration 타이밍 보정
   - mock(원 단위) vs react(만원 단위) 표기 차이 보정
   - 스크립트 대기시간/파싱 로직 수정

4. **결과**
   - `qa:commission-parity` 전 케이스 PASS
   - 리포트 저장:
     - `docs/COMMISSION_PARITY_REPORT_2026-04-16.md`
     - `docs/COMMISSION_PARITY_REPORT_2026-04-16.json`

### 핵심 파일(추가)
- `app/commission/page.tsx`
- `components/commission/CommissionPage.tsx`
- `components/commission/*`
- `lib/commission/types.ts`
- `lib/commission/rules.ts`
- `lib/commission/explain.ts`
- `lib/commission/share.ts`
- `lib/commission/history.ts`
- `scripts/commission-parity-smoke.mjs`
- `scripts/commission-smoke.mjs`

---

## 3) Header Search SEO 소개 문구 적용

### 사용자 요청
- 검색 input(`header-search-input`) 위에 SEO 친화 소개 문구 추가
- 문구안 A/B/C + 권장안 제시 후 즉시 적용

### 제시/선정
- 권장 최종안 채택:
  - 제목: **서울·수도권 아파트 실거래가 검색**
  - 설명: **아파트명·지역명으로 매매·전세·월세 실거래가를 빠르게 확인하세요. 최근 거래일, 가격 추이, 거래량 요약 정보를 제공합니다.**

### 반영 내용
- `components/HeaderSearch.tsx`
  - input 위 intro 블록 추가
  - 노출 조건: `compact !== true` && (`/` 또는 `/search`)
- `app/globals.css`
  - intro 전용 스타일 및 모바일 폰트 보정
- lint 이슈 정리
  - effect 내부 동기 setState 경고 제거(초기 state 방식 조정)

---

## 최종 상태 요약
- 홈(검색 허브): `/`
- 모방 페이지: `/mock/commission` (noindex + fallback 유지)
- 운영 계산기: `/commission` (분해 컴포넌트 기반)
- 공통 계산 API: `/api/commission/calc`
- parity: PASS 기준 확보
