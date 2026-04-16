# Conversation Log — 2026-04-16 (Commission Switch + Parity PASS)

## 사용자 요청
- `docs/commission-upgrade-tickets.md`를 순서대로 실행
- 다음 단계로:
  1) `/commission`를 `components/commission/CommissionPage.tsx`로 완전 스위치
  2) parity 스크립트 결과 PASS까지 마무리
- 마지막으로 대화 내용을 md 파일로 `notes`에 저장

---

## 수행 내용 요약

### 1) 티켓 실행 기반 작업 반영
- `/commission` 신규 경로 기반 구성 진행
- 계산 도메인 분리/정리
  - `lib/commission/types.ts`
  - `lib/commission/rules.ts`
  - `lib/commission/explain.ts`
  - `lib/commission/calc.ts` 리팩터
- 공유/기록 유틸 추가
  - `lib/commission/share.ts`
  - `lib/commission/history.ts`
- SEO/콘텐츠/컴포넌트 분해 파일 다수 추가
  - `components/commission/*`

### 2) `/commission` 완전 스위치
- `app/commission/page.tsx`에서 `components/commission/CommissionPage.tsx` 렌더로 전환 완료
- `CommissionPage`는 분해 컴포넌트 기반(폼/결과/근거/기록/공유/탭/요율표/FAQ/아티클/고지)

### 3) parity 테스트 실패 원인 분석 및 수정
- 초기 parity 실패 원인:
  - hydration 타이밍 이슈
  - mock 결과는 원 단위, react는 만원 단위 표기 차이
- 조치:
  - `scripts/commission-parity-smoke.mjs`에서 `/commission` 진입 후 대기시간 보강
  - mock total 파싱값을 `만원` 단위로 환산 비교하도록 수정
  - dealType 버튼 라벨 매칭 유연화 유지

### 4) 결과
- `npm run qa:commission-parity http://localhost:3000` 실행 결과 전 케이스 PASS
  - sale_house_default PASS
  - lease_house_default PASS
  - rent_house_with_monthly PASS
  - sale_distribution PASS
  - sale_officetel_custom_vat PASS
  - sale_etc_custom_rate PASS
- 리포트 갱신
  - `docs/COMMISSION_PARITY_REPORT_2026-04-16.md`
  - `docs/COMMISSION_PARITY_REPORT_2026-04-16.json`

---

## 이번 구간 핵심 변경 파일
- `app/commission/page.tsx`
- `components/commission/CommissionPage.tsx`
- `scripts/commission-parity-smoke.mjs`
- `lib/commission/calc.ts`
- `lib/commission/types.ts`
- `lib/commission/rules.ts`
- `lib/commission/explain.ts`
- `lib/commission/share.ts`
- `lib/commission/history.ts`
- `components/commission/*` (분해 컴포넌트 다수)

---

## 비고
- parity PASS 기준으로 `/commission`와 `/mock/commission` 계산 결과 일치성 확보.
- 이후 단계는 `/mock/commission` 축소(noindex 유지) 및 `/commission` 중심 운영 전환.
