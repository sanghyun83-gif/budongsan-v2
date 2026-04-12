# Conversation Log — 2026-04-12

## 작업 목표
- 맵 중심 UX를 제거하고 텍스트 검색 중심 구조로 전환
- DAPT 스타일 헤더/검색 흐름 모방
- `/search` 결과 페이지 정리 및 중복 검색 UI 제거
- 헤더 브랜딩(로고 마크) 개선

## 주요 진행 내역

### 1) 맵 연동 제거 및 텍스트 중심 전환
- 홈을 지도 기반 Explorer에서 텍스트 검색 중심으로 전환
- 맵 관련 파일 제거:
  - `app/api/map/complexes/route.ts`
  - `components/HomeMap.tsx`
  - `lib/map/kakao.ts`
  - `types/kakao.d.ts`
- `app/page.tsx`, `components/Explorer.tsx`, `components/SearchPanel.tsx`를 텍스트 UX 중심으로 개편

### 2) 검색 UX 재구성
- 검색어 입력 시 자동 검색(디바운스) 및 하단 결과 리스트 노출
- 리스트 카드: 단지명/지역/최근 가격/거래일 최소 정보 표시
- 과도한 문구/필터/보조 요소 축소

### 3) 전역 헤더 + `/search` 도입
- 전역 헤더 검색 컴포넌트 신설:
  - `components/HeaderSearch.tsx`
- 전역 헤더 컴포넌트 신설:
  - `components/GlobalHeader.tsx`
- 레이아웃 반영:
  - `app/layout.tsx`
- 검색 결과 페이지 신설:
  - `app/search/page.tsx`
  - `components/SearchResultsPage.tsx`
- `/`도 검색 중심 흐름에 맞춰 정리

### 4) 헤더 모방 계획 문서화 및 체크
- 문서 생성:
  - `docs/SALJIP_DAPT_HEADER_MIMIC_EXECUTION_PLAN_2026-04-12.md`
- 사용자 요청에 따라 1~8 항목 실행 및 체크 반영

### 5) 헤더/검색 중복 정리
- `/search` 본문 상단의 중복 검색 입력 제거
- 헤더 우측 링크 최소화(불필요 링크 정리)
- 헤더 음영(그라데이션/섀도우) 적용

### 6) 검색 입력 위치 조정
- 요청에 따라 헤더 내부 검색창을 헤더 아래 줄로 이동
- `HeaderSearch`를 `layout`에서 헤더 하단 영역으로 배치

### 7) 브랜딩 아이콘 수정
- `S` 텍스트 로고 마크 제거
- 집 + 시세선(상승 추세) SVG 마크로 교체

## 사용자 요청 기반 운영 원칙
- “우선 모방 후 업그레이드” 방향 준수
- 불필요한 링크/문구/미제공 기능 제거 우선
- 요청 시 lint/build 생략 진행

## 파일 생성/수정 하이라이트
- 생성:
  - `components/HeaderSearch.tsx`
  - `components/GlobalHeader.tsx`
  - `components/SearchResultsPage.tsx`
  - `app/search/page.tsx`
  - `docs/SALJIP_DAPT_HEADER_MIMIC_EXECUTION_PLAN_2026-04-12.md`
- 주요 수정:
  - `app/layout.tsx`
  - `app/page.tsx`
  - `app/globals.css`
  - `components/SearchPanel.tsx`
  - `components/GlobalHeader.tsx`
  - `components/HeaderSearch.tsx`
  - `components/SearchResultsPage.tsx`

## 추가 작업 로그 (동일 날짜 세션)

### UI/검색 동작 수정
- 단지 상세 상단의 좌표 품질 칩 제거
  - `app/complexes/[id]/page.tsx`
  - `app/about/page.tsx`의 좌표 품질 관련 문구도 정리
- 로고 클릭 시 헤더 검색어 리셋 동작 개선
  - `components/HeaderSearch.tsx` URL 동기화 방식 정리
- 검색 결과 클릭 후 상세 진입 시 자동으로 `/search`로 되돌아가는 리다이렉트 버그 수정
  - 빈 검색어 처리 조건을 `/search` 경로로 제한
- 한글 IME 조합 중 철자 깨짐(자동 글자 추가) 완화
  - composition 이벤트 처리 추가/보완
- 검색 반응 속도 개선
  - 검색/라우팅 디바운스 단축(220ms → 80ms)
  - 동일 질의 결과 캐시 적용(`SearchResultsPage`, `SearchPanel`)
- 헤더 검색 버튼 제거(즉시 검색 UX 유지)

### 검색 매칭 개선
- 붙여쓴 검색어 매칭 강화
  - 예: `명일우성` 입력 시 `명일 우성` 계열도 매칭되도록 토큰 분할 기반 조건 추가
  - 수정 파일:
    - `lib/search/matcher.ts`
    - `app/api/search/route.ts`

### 홈 섹션 작업
- `이번달 최고가 매매` 영역을 한때 추가 후,
  - DB 연동 API 신설: `app/api/home/top-month-deals/route.ts`
  - 이후 사용자 요청으로 해당 섹션 UI를 최종 제거
  - 현재: 검색어 비어있을 때도 해당 섹션 미노출

### 데이터 적재 작업 (서울 11740 강동구)
- 202603 적재 실행
  - 명령: `node scripts/ingest-molit.mjs --regions=11740 --dealYmd=202603`
  - 결과: fetched 190 / normalized 190 / raw 신규 188 / normalized 신규 190
- 202602 누락분 보강 실행
  - 명령: `node scripts/ingest-molit.mjs --regions=11740 --dealYmd=202602`
  - 결과: fetched 293 / normalized 293 / raw 신규 122 / normalized 신규 145
- 우선순위 문서 로그 반영
  - `docs/SEOUL_COVERAGE_PRIORITY_2026-03-10.md`

## 메모
- 마지막 사용자 요청: conversation 로그를 md로 `notes` 폴더에 저장
