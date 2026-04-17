# 중개보수 페이지 React 전환 계획 (4차 패치)

## 목표
- 원본 HTML 모방 화면에서 jQuery/bootstrap/common.js/calc.js 의존 제거
- React 상태 기반 UI/비즈니스 로직으로 단계적 이관

## 현재 적용 상태
1. `/mock/commission`:
   - 광고/추적/외부 위젯 제거
   - 대형 GNB 축소
   - 외부 링크 정책 적용
   - 레거시 script 전체 제거 + 최소 동작 런타임만 주입
2. `/commission-react`:
   - React 골격 페이지 추가(계약종류/물건종류/입력 필드 토글)
   - `lib/commission/calc.ts` 계산 엔진 연동
   - 결과표(요율/한도/보수/부가세/합계/근거) 출력
3. `/mock/commission`:
   - 계산 버튼(`doTran`)을 `/api/commission/calc`로 연결
   - `/commission-react`와 동일 계산엔진 결과를 사용하도록 동기화
4. parity QA:
   - `scripts/commission-parity-smoke.mjs` 추가
   - `npm run qa:commission-parity`로 mock/react 합계 일치 자동 검증

## 다음 단계
1. 입력 모델 정의
   - dealType, realEstateType, amount, rent, premium, customRate, vatRate
2. 계산 엔진 모듈화
   - `lib/commission/calc.ts` 신규
   - 서울 기준 요율표 상수/구간별 계산 함수 분리
3. 결과 UI 이관
   - 표/해설/참고사항을 React 컴포넌트로 분리
4. 저장/공유 기능 재구현
   - 브라우저 저장(로컬) + URL 직렬화 방식
5. `/mock/commission` 종료
   - `/` 기본 진입을 `/commission-react`로 스위치
