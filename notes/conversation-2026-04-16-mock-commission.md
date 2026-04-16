# Conversation Log — 2026-04-16

## 요청 요약
사용자는 `http://localhost:3000/`에 원본 중개보수 페이지를 강하게 모방하고,
단계적으로 정리/업그레이드하기를 요청함.

---

## 진행 단계

### 1) 완전 모방 1차
- `/mock/commission` 라우트에서 원본 페이지 프록시 렌더 구현
- `/`에서 모방 화면 노출 구조 구성(초기엔 redirect/iframe 기반)

### 2) 삭제 후보 체크리스트 정리
- 광고/추적/외부 위젯/불필요 메뉴/브랜드/레거시 JS 제거 후보 정리

### 3) 삭제 1차 패치
- 광고, 추적 스크립트, 외부 위젯 제거 로직 적용

### 4) 삭제 2차 패치
- 원본 브랜드/프로모션 축소
- 대형 GNB 간소화
- 원본 도메인 링크 무력화/치환

### 5) 삭제 3차 패치
- 외부 링크 정책(정부/기관 링크 allow + 새창)
- 인라인 스타일 정리
- iframe 의존 제거 준비

### 6) 4차 패치 (레거시 JS 의존 축소)
- mock에서 jQuery/bootstrap/common.js/calc.js 등 의존 축소
- 최소 런타임 스크립트 주입으로 탭/폼 토글 동작 유지
- React 전환 골격 페이지 추가: `/commission-react`

### 7) 5차 패치 (실제 계산 엔진)
- `lib/commission/calc.ts` 계산 엔진 추가
- `/commission-react` 결과표 출력 연동

### 8) 6차 패치 (공통 엔진 일치)
- API 추가: `POST /api/commission/calc`
- `/mock/commission`의 계산 버튼을 동일 엔진 API에 연결

### 9) 7차 패치 (parity QA)
- 스크립트 추가: `scripts/commission-parity-smoke.mjs`
- npm script 추가: `qa:commission-parity`
- mock/react 합계값 자동 비교 리포트 생성

---

## 이후 사용자 요청 반영

### 루트 복구 + 헤더 링크
- `/`를 원래 검색 허브로 복구
- 헤더에 `/mock/commission` 링크 추가
- `/mock/commission`에서는 전역 chrome 숨김

### fallback 화면 강화
- 원본 upstream(Cloudflare 403) 실패 시 JSON 오류 대신 fallback HTML 렌더
- fallback에 참고사항 표, intro 탭(설명/지역별 요율/요율 상한) 추가
- 탭 전환 JS 추가

### 계산 버튼 동작 오류 수정
- 런타임 스크립트 문법 에러(`Invalid or unexpected token`) 수정
- `doTran is not defined` 해결
- `#submit` 클릭 시 결과 렌더 확인

### 계산 결과 UI 모방 강화
- 요청된 계산 결과 블록 구조(계산서, 저장하기, 안내, 해설) 형태 반영
- `addSubmit` 누적 계산 지원
- `copyTable`, `downloadCsv`, `hideCol`, `showModalCalc` 스텁/동작 추가

### 라벨 모방 오류 수정
- `월세계약 + 오피스텔`에서 오른쪽 칸 라벨이 `보증금`으로 덮이던 이슈 수정
- 메인 금액 라벨만 업데이트하도록 로직 분리

---

## 현재 주요 경로
- 홈(검색 허브): `/`
- 모방 페이지: `/mock/commission`
- React 전환 페이지: `/commission-react`
- 계산 API: `/api/commission/calc`

---

## 생성/수정 핵심 파일
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

## 비고
- 원본 사이트 upstream은 Cloudflare 차단(403) 가능성이 높아 fallback 경로를 유지함.
- mock 화면은 “모방 우선” 상태이며, 이후 살집 맞춤 React 전환/정리 단계가 예정됨.
