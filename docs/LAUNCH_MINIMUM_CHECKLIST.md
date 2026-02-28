# 런칭 최소 체크리스트 (Top-tier MVP)

상태 라벨:
- `[done]` 코드/검증 완료
- `[partial]` 코드 반영 + 운영 설정 필요
- `[todo]` 미구현

## 실행 순서

1. `[partial]` Production 배포 고정
- 최신 `main`을 Vercel Production에 배포
- `/`, `/api/search`, `/api/map/complexes`, `/api/complexes/:id`, `/api/complexes/:id/deals` 스모크 테스트
- 남은 작업: 다음 push 이후 Production 최종 스모크 1회

2. `[partial]` 환경변수 최종 점검
- 필수: `NEXT_PUBLIC_KAKAO_JS_KEY`, `DATA_GO_KR_API_KEY`, `DATABASE_URL`, `NEXT_PUBLIC_BASE_URL`
- 일일 작업용: `CRON_SECRET`
- 남은 작업: Preview/Production 값 일치 확인

3. `[done]` 홈 탐색 루프 안정화
- 검색/필터/지도 bounds 동기화
- URL query 상태 복원(`q`, `sw_lat`, `sw_lng`, `ne_lat`, `ne_lng`)

4. `[done]` 예외/빈응답 표준화
- `400/404/500` 응답 포맷 통일
- 빈 결과 UI 문구 처리

5. `[done]` 데이터 신뢰 라벨 노출
- 홈/상세에 출처 + 업데이트 시각 노출

6. `[done]` 모바일 최적화 기본선
- input/button 터치 영역 최소 44px
- 지도 높이 반응형(`360px` mobile, `540px` desktop)
- 좁은 화면에서 결과 카드 레이아웃 보정

7. `[done]` CTA + 이벤트 로그
- 상세 CTA를 interactive client component로 전환
- 클릭 이벤트를 `POST /api/events/cta`로 수집
- 서버에서 로그 기록 + DB 연결 시 `audit_log` 저장

8. `[done]` 관측성(Observability) 기본선
- 라우트별 API 지표(count, error, p50, p95) 기록
- 구조화된 에러 로그 추가

9. `[done]` 일일 정규화 자동화
- SQL: `sql/003_normalize_from_raw.sql`
- 수동 실행: `npm run db:normalize`
- 보호된 cron endpoint: `GET /api/cron/normalize`
- 인증 헤더: `x-cron-secret` 또는 `Authorization: Bearer <CRON_SECRET>`
- Vercel cron 스케줄 연결: `vercel.json` (`0 18 * * *`, KST 03:00)
- 증빙: `docs/DAILY_NORMALIZE_RUNBOOK.md`

10. `[done]` 런칭 게이트
- 회귀 테스트 1회 PASS: `docs/LAUNCH_GATE_REPORT_2026-02-28.md`
- Lighthouse 모바일 리포트 생성:
  - HTML: `docs/lighthouse-mobile.html`
  - JSON: `docs/lighthouse-mobile.json`
- Lighthouse 점수(모바일): Performance 69, Accessibility 100, Best Practices 77, SEO 100

## Go / No-Go

- Go: `partial/todo` 해소 + Production 치명 오류 없음
- No-Go: 반복 5xx, 모바일 주요 깨짐, 지도/리스트 비동기 불일치

## 연계 문서

- 범위: `docs/MVP2_SCOPE.md`
- UI 명세: `docs/UI_MVP2_SPEC.md`
- 컴포넌트: `docs/COMPONENT_SYSTEM.md`
- 실행 로그: `docs/PHASE2_EXECUTION_LOG.md`
