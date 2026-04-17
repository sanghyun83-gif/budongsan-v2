# Legal + Docs 통합 업그레이드 티켓 (살집 맞춤형)

## Phase 1 — 라우팅/엔트리 정리 (통합 기준 고정)

### Ticket 1.1 `/legal` 단일 엔트리 확정
- **파일**
  - `app/legal/page.tsx`
  - `app/legal/LegalPageClient.tsx`
- **TODO**
  - `/legal`를 단일 서비스 진입점으로 고정
  - 하단 정책문서(구 docs/413)는 `/legal` 내부 섹션으로만 렌더

### Ticket 1.2 `/docs/[id]` 분리/축소 정책
- **파일**
  - `app/docs/[id]/page.tsx` (현재 삭제 상태 점검)
  - `app/docs/page.tsx`
- **TODO**
  - `/docs/413` 직접 접근 차단/리다이렉트 정책 결정
  - `/docs` 목록에서는 “/legal로 통합” 안내 유지

### Ticket 1.3 헤더/내비 링크 통일
- **파일**
  - `components/GlobalHeader.tsx`
  - (필요시) `components/RouteChrome.tsx`
- **TODO**
  - 글로벌 메뉴에 `/legal` 노출 정책 반영
  - 중복/실험 링크 제거(운영용 기준 정리)

---

## Phase 2 — SEO/메타/인덱싱 재설계

### Ticket 2.1 `/legal` 메타 고도화
- **파일**
  - `app/legal/page.tsx`
  - `lib/seo/metadata.ts`
- **TODO**
  - title/description/OG/twitter를 검색의도형으로 개편
  - canonical `/legal`로 고정

### Ticket 2.2 문서 통합형 JSON-LD 구성
- **파일**
  - `components/legal/LegalSeoJsonLd.tsx` (신규)
  - `app/legal/page.tsx`
- **TODO**
  - `WebApplication` + `Article` + `FAQPage` 조합 삽입
  - “계산기 + 정책문서” 복합 페이지 구조 반영

### Ticket 2.3 인덱싱 가드 점검
- **파일**
  - `app/robots.ts`
  - (필요시) `app/sitemap.ts`
- **TODO**
  - `/legal`만 색인, 중복 경로는 색인 제외
  - 사이트맵 URL 우선순위 반영

---

## Phase 3 — 살집 디자인 시스템으로 UI 전면 전환

### Ticket 3.1 `/legal` 레이아웃 재구성 (살집 톤)
- **파일**
  - `app/legal/LegalPageClient.tsx`
  - `styles/legal/legal.css`
- **TODO**
  - 살집 카드/여백/타이포/섀도우 규칙으로 통일
  - 데스크탑 2컬럼(입력/결과), 모바일 1컬럼 재배치

### Ticket 3.2 컴포넌트 시각 일관성 강화
- **파일**
  - `components/legal/*`
- **TODO**
  - 버튼/인풋/뱃지/알림 스타일을 commission 페이지 톤과 통일
  - 아이콘/클래스 네이밍 표준화

### Ticket 3.3 문서 섹션 UI 정식 컴포넌트화
- **파일**
  - `components/docs/DocsArticlePage.tsx`
  - `styles/docs/docs.css`
- **TODO**
  - 게시글 헤더/첨부파일/댓글 블록을 살집 카드 시스템으로 정리
  - 임베드 모드(`embedded`) 시 여백/폭/경계선 최적화

---

## Phase 4 — 법무사 계산엔진/도메인 모델 정교화

### Ticket 4.1 룰 테이블 분리 및 타입 정리
- **파일**
  - `lib/legal/calc.ts`
  - `lib/legal/rules.ts`
  - `lib/legal/types.ts`
- **TODO**
  - 구간/요율/상한/공공비용 룰을 테이블 중심으로 재정의
  - 입력/출력 타입을 계산 단계별로 명시

### Ticket 4.2 계산 해설 문구 일관화
- **파일**
  - `lib/legal/explain.ts`
  - `components/legal/LegalBasisSection.tsx`
- **TODO**
  - “어떤 구간/요율/상한이 적용됐는지”를 사용자 친화 문장으로 생성
  - 결과표 컬럼과 해설 텍스트 1:1 매핑

### Ticket 4.3 입력 검증/오류 UX 강화
- **파일**
  - `lib/legal/validator.ts`
  - `components/legal/LegalForm.tsx`
- **TODO**
  - 경계값/빈값/비정상값 검증 고도화
  - 에러 메시지 위치/문구 일관 적용

---

## Phase 5 — 결과/기록/저장 UX 업그레이드

### Ticket 5.1 결과 테이블 정보 구조 최적화
- **파일**
  - `components/legal/LegalResultSection.tsx`
- **TODO**
  - 핵심 요약(합계/적용보수) 강조, 상세항목 접기/펼치기 구조 고려
  - 모바일 가독성(가로스크롤 + 고정열) 개선

### Ticket 5.2 기록 UX 개선
- **파일**
  - `components/legal/LegalHistoryBox.tsx`
  - `lib/legal/history.ts`
- **TODO**
  - 최근 기록 정렬/복원/삭제 UX 개선
  - 기록 라벨 표준 포맷(유형·금액·합계·시간) 적용

### Ticket 5.3 저장/공유 품질 보강
- **파일**
  - `components/legal/LegalSaveSection.tsx`
  - `lib/legal/export-image.ts`
  - `lib/legal/export-pdf.ts`
  - `lib/legal/share.ts`
- **TODO**
  - 저장 실패 fallback 메시지 정리
  - 공유 URL 복원 정확도/복사 피드백 개선

---

## Phase 6 — 통합 문서(/docs/413) 콘텐츠 신뢰도 강화

### Ticket 6.1 문서 메타 블록 정리
- **파일**
  - `components/docs/DocsArticlePage.tsx`
- **TODO**
  - 작성자/기준일/개정일/출처를 구조적으로 표기
  - “최신 기준” 문구와 실제 기준일 동기화

### Ticket 6.2 첨부파일/외부링크 처리 개선
- **파일**
  - `components/docs/DocsArticlePage.tsx`
- **TODO**
  - 파일 타입/크기/다운로드 아이콘 정리
  - 외부 링크 안내 문구/새창 표기 일관화

### Ticket 6.3 댓글 영역 운영모드 구분
- **파일**
  - `components/docs/DocsArticlePage.tsx`
- **TODO**
  - 샘플 인터랙션과 실운영 기능 분리(명확한 라벨링)
  - captcha 영역 실제/더미 모드 구분

---

## Phase 7 — QA/회귀 테스트/전환

### Ticket 7.1 `/legal` 스모크 테스트 작성
- **파일**
  - `scripts/legal-smoke.mjs` (신규)
- **TODO**
  - 렌더/계산/기록/저장 버튼 노출 기본 검증
  - 핵심 텍스트/섹션 존재 검사

### Ticket 7.2 계산 회귀 테스트
- **파일**
  - `scripts/legal-parity-smoke.mjs` (신규)
- **TODO**
  - 구간 경계값/공공비용 on/off/유형 전환 케이스 추가
  - 기대값 diff 리포트 출력

### Ticket 7.3 최종 정리
- **파일**
  - `docs/*` (작업 로그)
  - 관련 라우트/링크 파일
- **TODO**
  - `/legal` 통합 페이지를 공식 경로로 확정
  - 중복 경로/임시 UI 제거 체크리스트 완료

---

## 우선순위(추천)
1. **P0**: Phase 1~2 (통합 경로/SEO 고정)
2. **P1**: Phase 3~4 (살집 UI + 계산 정확도)
3. **P2**: Phase 5~6 (사용성/신뢰도)
4. **P3**: Phase 7 (자동화/운영 마감)
