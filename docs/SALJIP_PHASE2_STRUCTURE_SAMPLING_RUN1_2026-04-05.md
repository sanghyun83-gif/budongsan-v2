# SALJIP Phase 2 구조 모방 전수조사 1회차 (2026-04-05)

## 목적
- HYBRID Phase 2 Step 2-8의 첫 실행 기록
- APTHI/DAPT(유입 구조) + KB/네이버(상세 품질) + 직방(동선 최소)를 샘플링 방식으로 구조 분석

## 조사 규칙
- 전량 크롤링 금지, 샘플링 기반만 수행
- 문구/브랜드 자산 복제 금지, 구조 패턴만 추출
- 추출 항목 고정:
  1) URL 패턴
  2) 메타/타이틀 패턴
  3) 상단 요약(숫자/날짜/거래량)
  4) 내부링크 패턴
  5) 신뢰 신호(출처/업데이트/기준)
  6) 탭/정보 위계

---

## 1) 샘플 세트 (1회차)

### A. APTHI (유입 구조)
- 샘플 URL
  - `https://apthi.kr/`
  - `https://apthi.kr/apttrade`
- 구조 관찰
  - 거래유형 분리 카테고리 노출
  - 지역 단위 링크 탐색이 촘촘함
  - 텍스트/표 중심의 규칙 패턴 강함
- saljip 반영 항목
  - [x] 카테고리형 진입 구조 참조
  - [x] 지역/브랜드 허브 확장 우선
  - [x] 텍스트 요약+숫자 신호 상단 고정

### B. DAPT (유입 구조)
- 샘플 URL
  - `https://dapt.kr/`
  - `https://dapt.kr/search/`
- 구조 관찰
  - 가벼운 텍스트 중심 상세/검색 구조
  - 전국 단지 커버리지 인식 메시지 활용
- saljip 반영 항목
  - [x] 텍스트 중심 상세 가독성 유지
  - [x] 대량 페이지 운영 시 규칙 URL/내부링크 유지

### C. KB부동산 (상세 품질)
- 샘플 URL
  - `https://www.kbland.kr/se/c/42101`
- 구조 관찰
  - 시세/실거래/기본정보/탭 위계가 명확
  - 상단 핵심 지표와 신뢰 신호 노출 강함
- saljip 반영 항목
  - [x] 상세 탭 위계 유지 (`시세·실거래` 우선)
  - [x] 출처/업데이트/기준시점 고정

### D. 네이버페이 부동산 (상세 품질)
- 샘플 URL
  - `https://land.naver.com/`
  - `https://fin.land.naver.com/complexes/129502`
- 구조 관찰
  - 단지 페이지 탭 구조 + 기간 흐름이 명확
  - 지역/필터 체계가 사용자 의도 중심
- saljip 반영 항목
  - [x] 탭형 상세 구조 유지
  - [x] 단일 흐름 방해 요소 최소화

### E. 직방 (동선 최소)
- 샘플 URL
  - `https://play.google.com/store/apps/details?hl=ko&id=com.chbreeze.jikbang4a`
  - `https://company.zigbang.com/newsroom/view?idx=347`
- 구조 관찰
  - 지도 중심 탐색→선택→상세 동선이 짧음
- saljip 반영 항목
  - [x] `검색→줌인(1회)→핀클릭→상세` 유지

---

## 2) 반영 비중 점검 (Step 2-8 규칙)
- APTHI/DAPT형(대량 텍스트 구조): **80%**
- KB/네이버형(상세 품질 보정): **20%**
- 판정: 운영 원칙(75~85 / 15~25) 내 적합

## 3) 이번 배치 적용 지시 (Batch A)
- 우선 적용 대상: `docs/SALJIP_TEXT_PAGE_BATCH1_10URL_WORKSHEET_2026-04-04.md`
- 적용 우선순위:
  1. 상단 요약문 숫자 신호 강화
  2. description 길이/의도 정렬
  3. 내부링크 8~12 규칙 점검

## 4) 다음 조사(2회차) 예약
- 목표: 샘플 확대 + 미반영 패턴 보완
- 예정 시점: 다음 주 화요일 배치 시작 전
- TODO:
  - [ ] APTHI 상세 샘플 10개 추가
  - [ ] DAPT 상세 샘플 10개 추가
  - [ ] KB/네이버 탭/기간 노출 패턴 비교표 추가

## 출처
- `docs/SALJIP_TEXT_HEAVY_NATIONWIDE_DB_STRATEGY_REPORT_2026-03-30.md`
- `docs/SALJIP_TEXT_MASS_PAGE_IMPLEMENTATION_PLAN_2026-03-30.md`
- `docs/SALJIP_SERP_TOP1_COMPETITOR_INVESTIGATION_REPORT_2026-03-27.md`
- 공홈/공식 페이지:
  - https://apthi.kr/
  - https://dapt.kr/
  - https://www.kbland.kr/
  - https://land.naver.com/
  - https://company.zigbang.com/
