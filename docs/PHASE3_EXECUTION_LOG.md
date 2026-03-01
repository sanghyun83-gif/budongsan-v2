# PHASE3_EXECUTION_LOG

- 시작일: 2026-03-01
- 단계 목표: MVP-3 (Step 2 → Step 3 → Step 4)

## Step 2. 정렬/랭킹/UI

### 구현
1. `GET /api/search`
- `sort=latest|price_desc|price_asc|deal_count` 지원
- 응답에 `appliedSort`, `totalCount`, `updatedAt` 포함

2. `GET /api/map/complexes`
- 동일한 `sort` 규칙 적용
- 응답에 `appliedSort` 포함

3. `components/Explorer.tsx`
- 깨진 문자열/파싱 오류 전면 복구
- 정렬 드롭다운 추가
- 검색/지도/리스트 동기화 유지
- 0건 상태 빠른 액션(강남/송파/초기화) 추가
- KST 고정 포맷터로 시간 표시(하이드레이션 불일치 방지)

### 검증
- `npm run lint` 통과
- `npm run build` 통과
- `/api/search?...&sort=price_desc` 정상 응답 확인
- `/api/map/complexes?...&sort=deal_count` 정상 응답 확인

## Step 3. 성능/인덱스

### 구현
1. `sql/004_mvp3_indexes.sql`
- `pg_trgm` extension
- `complex.apt_name`, `complex.legal_dong` trigram index
- `complex(region_id, updated_at)` index
- `deal_trade_normalized` 복합 인덱스 2종
- `deal_trade_raw(ingested_at)` index

2. `package.json`
- `npm run db:indexes:mvp3` 스크립트 연결

### 검증
- `npm run db:indexes:mvp3` 실행 완료 (`Applied SQL` 확인)

## Step 4. 운영 안정화

### 구현
1. `GET /api/cron/normalize`
- `x-cron-secret` 또는 `Authorization: Bearer` 인증
- 성공/실패 시 `audit_log`에 이벤트 기록
  - `cron_normalize_success`
  - `cron_normalize_error`

2. `GET /api/ops/data-freshness`
- 최근 24시간 raw/normalized 집계
- 최근 cron 실행 이력 조회

3. 런칭 게이트 회귀 스크립트
- `npm run qa:smoke`
- 결과 파일: `docs/LAUNCH_GATE_REPORT_2026-03-01.md`

### 검증
- `/api/ops/data-freshness` 로컬 200 확인
- `/api/cron/normalize` 로컬 503 확인 (`CRON_SECRET` 미설정 상태)
- `npm run qa:smoke` 통과

## 참고
- 로컬에서 `cron/normalize`를 200으로 테스트하려면 `.env.local`에 `CRON_SECRET` 추가 후 dev 서버 재시작 필요
- Vercel은 `CRON_SECRET` 설정 + Redeploy 후 동일 엔드포인트로 200 검증 가능