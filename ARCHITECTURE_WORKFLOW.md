# budongsan-v2 Architecture & Workflow

- Version: v1.0
- Date: 2026-02-28
- Repository: `C:\Users\Sam\Desktop\budongsan-v2`
- Approach: API-First + Data-Driven Design + SDLC

## 1) 목적과 원칙

### 목적
`budongsan-v2`는 한국 부동산 서비스의 핵심인 "신뢰 가능한 데이터 탐색"을 먼저 완성하고, 이후 중개사/운영/수익화 기능을 확장하는 구조로 설계한다.

### 핵심 원칙
1. API-First: 화면보다 API 계약과 데이터 품질을 먼저 확정한다.
2. Data-Driven: 기능 우선순위는 사용자 화면이 아니라 데이터 신뢰도/정합성 기준으로 결정한다.
3. Stability First: 린트/타입/테스트/관측 없이 기능을 추가하지 않는다.
4. Phase Delivery: 각 단계는 독립 배포 가능한 범위로 끊는다.

## 2) 제품 범위 (MVP -> V1 -> V2)

### MVP (현재~1차 출시)
1. 공공 실거래가 수집/정규화
2. 지도 bbox 기반 단지 조회 API
3. 지역/가격 중심 검색 API
4. 기본 지도 UI (마커/클러스터)
5. 데이터 품질 검증 및 에러 모니터링

### V1
1. 단지 상세 (거래추세, 평형별 분포, 거래량)
2. 관심단지/알림
3. 랭킹/리포트
4. 운영자 데이터 검수 콘솔

### V2
1. 중개사 인증(KYC) + 권한 체계
2. 허위매물 신고/제재 워크플로우
3. 중개사 리드/노출 상품
4. 대화형 검색(AI)

## 3) 시스템 아키텍처

## 3.1 컨텍스트 레벨
1. Client (Web, Mobile Web)
2. API Server (Next.js Route Handlers, 이후 분리 가능)
3. DB (PostgreSQL + PostGIS 예정)
4. Cache (Redis/Upstash)
5. External APIs
   - 국토교통부/공공데이터 (실거래)
   - Kakao Maps SDK

## 3.2 컴포넌트 레벨 (현재 코드 기준)
1. `app/api/*`
   - `/api/deals`: 지역 실거래 조회
   - `/api/map/complexes`: bbox 단지 조회
2. `lib/api/molit.ts`
   - 공공 API 호출, XML 파싱, 정규화
3. `lib/map/kakao.ts`
   - Kakao SDK 로드
4. `components/HomeMap.tsx`
   - 지도 렌더 + API 호출
5. `lib/regions.ts`, `lib/types.ts`
   - 공통 도메인 모델

## 3.3 타겟 아키텍처 (확장형)
1. Ingestion Layer
   - 스케줄러(Cron)로 월별/지역별 실거래 수집
   - 재시도/백오프/실패 큐
2. Core API Layer
   - Query API (검색/지도/상세)
   - Auth API (유저/중개사/운영자)
   - Moderation API (신고/제재)
3. Data Layer
   - Raw 거래원장(append-only)
   - 정규화 단지 마스터
   - 검색 인덱스 테이블/뷰
4. Admin Layer
   - 데이터 품질 대시보드
   - 중개사 인증 및 신고 처리 콘솔

## 4) 데이터 아키텍처 (초안)

### 4.1 핵심 엔티티
1. `region`
2. `complex`
3. `deal_trade_raw`
4. `deal_trade_normalized`
5. `user`
6. `agent` (중개사)
7. `agent_verification`
8. `listing` (매물)
9. `listing_report` (신고)
10. `audit_log`

### 4.2 설계 원칙
1. Raw와 Normalized를 분리한다.
2. 거래 원본은 절대 덮어쓰지 않는다(append-only).
3. 좌표는 `geometry(Point, 4326)` 표준으로 저장한다.
4. 검색 성능은 `bbox + price + date` 복합 인덱스로 확보한다.

### 4.3 PostGIS 예시 스키마 (요약)
```sql
CREATE TABLE complex (
  id BIGSERIAL PRIMARY KEY,
  region_code VARCHAR(5) NOT NULL,
  apt_name TEXT NOT NULL,
  legal_dong TEXT,
  location geometry(Point, 4326),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_complex_location ON complex USING GIST (location);
CREATE INDEX idx_complex_region_name ON complex(region_code, apt_name);
```

## 5) API 아키텍처

### 5.1 API 계약 원칙
1. 모든 API는 명시적 입력 검증(zod) 사용
2. 에러 포맷 통일: `{ ok: false, error, code }`
3. 페이지네이션/정렬/필터를 표준 쿼리로 통일
4. 응답 필드는 프론트 표시용이 아니라 도메인 표준 우선

### 5.2 우선 API 목록
1. `GET /api/deals?region=11680&months=3&sort=recent|top&limit=50`
2. `GET /api/map/complexes?sw_lat=&sw_lng=&ne_lat=&ne_lng=`
3. `GET /api/complexes/:id`
4. `GET /api/complexes/:id/deals`
5. `GET /api/search?q=&region=&min_price=&max_price=`

### 5.3 성능 목표(SLO)
1. 지도 API p95 < 500ms (캐시 hit 시)
2. 검색 API p95 < 700ms
3. API 에러율 < 1%
4. 데이터 수집 성공률 > 99%

## 6) SDLC / Workflow (권장 실행 순서)

## Phase 1. Architecture & Requirements
1. PRD 작성 (문제, 사용자, KPI, 범위)
2. 도메인 모델 확정 (complex/deal/listing/agent)
3. 비기능 요구사항 정의 (성능, 보안, 관측)

Gate:
1. PRD 승인
2. ERD 1차 승인
3. API 목록 확정

## Phase 2. Data Modeling
1. PostgreSQL + PostGIS 세팅
2. 마이그레이션 체계(Drizzle/Prisma/Flyway 중 택1)
3. seed 및 샘플 데이터 생성

Gate:
1. 핵심 테이블 + 인덱스 + 제약조건 적용
2. bbox 쿼리 성능 검증

## Phase 3. Backend Development
1. 외부 API 수집 모듈
2. Normalization 파이프라인
3. Query API 구현
4. 캐시 전략(키 정책/TTL/무효화)

Gate:
1. API 스펙 테스트 통과
2. 실패 재시도/로깅 동작 확인

## Phase 4. Testing & Infrastructure
1. Unit/Integration Test
2. 계약 테스트 (API schema)
3. 모니터링(로그/메트릭/알람)
4. 배포 파이프라인

Gate:
1. CI green (lint, typecheck, test)
2. 스테이징 부하 테스트 통과

## Phase 5. Frontend
1. 지도/검색/상세 화면
2. API 연동
3. 에러/로딩/빈 상태 UX

Gate:
1. 핵심 사용자 여정 E2E 통과
2. Core Web Vitals 기준 충족

## Phase 6. Launch & Operations
1. 점진 배포(canary)
2. KPI 모니터링
3. 장애/데이터 이슈 Runbook 운영

Gate:
1. 첫 주 장애 대응 SLA 충족
2. KPI baseline 수집 완료

## 7) 중개사 인증의 우선순위 정의

결론:
1. "구현 1순위"는 아님 (MVP 핵심은 데이터 탐색)
2. "설계 1순위 포함"은 맞음

즉시 해야 할 것:
1. DB에 `agent`, `agent_verification`, `audit_log` 테이블은 미리 설계
2. 인증 상태머신 정의: `pending -> reviewing -> approved|rejected|suspended`
3. 운영자 권한 모델(Admin RBAC) 설계

나중에 구현:
1. 서류 업로드/검수 UI
2. 인증 만료/재심사 프로세스
3. 제재/복구 정책

## 8) 보안/정책

1. API 키는 `.env.local`로만 관리
2. PII 데이터 암호화/마스킹
3. 감사로그는 수정 불가(append-only)
4. 신고/제재 액션은 전부 감사로그 기록

## 9) CI/CD 품질 게이트

필수 파이프라인:
1. `npm run lint`
2. `tsc --noEmit`
3. unit/integration test
4. build

배포 조건:
1. 모든 체크 green
2. 마이그레이션 dry-run 성공
3. rollback 계획 존재

## 10) 즉시 실행 액션 (다음 2주)

1주차
1. Postgres/PostGIS 도입
2. ERD와 마이그레이션 작성
3. `/api/map/complexes` DB 조회로 전환

2주차
1. 수집 스케줄러 구축
2. `/api/search` 구현
3. observability(요청 ID, 에러 코드, 대시보드) 적용

---

## 부록 A. 현재 디렉토리 기준 권장 구조

```txt
app/
  api/
    deals/route.ts
    map/complexes/route.ts
  page.tsx
components/
  HomeMap.tsx
lib/
  api/molit.ts
  map/kakao.ts
  regions.ts
  types.ts
types/
  kakao.d.ts
docs/
  (향후 PRD, ERD, API spec)
```

## 부록 B. 문서 세트 제안

1. `PRD.md`
2. `ERD.md`
3. `API_SPEC.md`
4. `MODERATION_POLICY.md`
5. `AGENT_VERIFICATION_POLICY.md`
6. `RUNBOOK.md`

## 11) Localhost 구현 매핑표 (API/화면/DB/완료조건)

### 11.1 목적
이 표는 "문서"를 "실행"으로 바꾸기 위한 운영 체크리스트다.
`localhost:3000` 기준으로 기능 단위 검증 경로를 고정한다.

### 11.2 매핑표

| 영역 | 구현 항목 | 로컬 확인 경로/명령 | DB/저장소 영향 | 완료 조건 (DoD) |
|---|---|---|---|---|
| API | 실거래 조회 API | `GET /api/deals?region=11680&sort=top&months=3&limit=20` | 현재 외부 API 직접 조회 (향후 `deal_trade_*`) | 200 응답, `ok=true`, `deals.length>0` |
| API | 지도 bbox API | `GET /api/map/complexes?sw_lat=37.0&sw_lng=126.4&ne_lat=37.8&ne_lng=127.5` | 현재 메모리 응답 (향후 `complex` + PostGIS) | bbox 필터 결과 반환, p95 측정 가능 |
| 화면 | 홈 지도 렌더 | `GET /` | 없음 | 카카오 지도 로드 + 마커 표시 + 콘솔 에러 0 |
| 품질 | 린트 게이트 | `npm run lint` | 없음 | 에러 0 |
| 품질 | 빌드 게이트 | `npm run build` | 없음 | 빌드 성공 |
| 설정 | 환경변수 | `.env.local` | 키 저장 | `DATA_GO_KR_API_KEY`, `NEXT_PUBLIC_KAKAO_JS_KEY` = SET |

### 11.3 단계별 로컬 실행 순서
1. `cd C:\Users\Sam\Desktop\budongsan-v2`
2. `npm run dev`
3. 브라우저: `http://localhost:3000`
4. API 스모크 테스트
   - `/api/deals?region=11680&sort=top&months=3&limit=20`
   - `/api/map/complexes?sw_lat=37.0&sw_lng=126.4&ne_lat=37.8&ne_lng=127.5`
5. 품질 게이트
   - `npm run lint`
   - `npm run build`

### 11.4 현재 상태 (2026-02-28 기준)
1. `npm run lint`: 통과
2. `npm run build`: 통과
3. 지도/실거래 API: 동작
4. 미구현
   - PostGIS 영속 저장
   - 검색 API(`/api/search`)
   - 단지 상세 API(`/api/complexes/:id`)
   - 인증/권한

## 12) Top Tier 벤치마크-대응 로드맵 (기능별 출처/우선순위/KPI)

### 12.1 벤치마크 반영 원칙
1. 복제 금지: UI가 아니라 운영 모델/신뢰 모델/데이터 모델을 흡수한다.
2. 단계 흡수: MVP에서 신뢰 기반을 먼저 만들고, 공급자 기능은 V2로 올린다.
3. KPI 우선: 기능 추가 전 측정 지표를 먼저 정의한다.

### 12.2 로드맵 표

| 단계 | 기능 묶음 | 벤치마크 출처(성격) | 우선순위 | KPI | 목표 시점 |
|---|---|---|---|---|---|
| MVP | 실거래/지도/검색 API 안정화 | 호갱노노(데이터 탐색), 다방(지도 루프) | P0 | API p95, 오류율, 재방문율 | 즉시~4주 |
| MVP | 데이터 품질 파이프라인(정규화/검증) | 네이버(신뢰기반 데이터 표준화) | P0 | 정합성 오류율, 수집 성공률 | 2~6주 |
| V1 | 단지 상세 지표(거래량/평형/추세) | 호갱노노(단지 깊이) | P1 | 상세 체류시간, 비교 클릭률 | 6~10주 |
| V1 | 관심/알림/저장검색 | 다방(사용자 루프), 네이버(반복 탐색) | P1 | 알림 구독률, 재유입률 | 8~12주 |
| V1 | 운영 검수 콘솔(데이터/신고 초안) | 네이버/직방(운영 통제) | P1 | 검수 처리시간, 오탐률 | 10~14주 |
| V2 | 중개사 인증/KYC | 네이버/직방(중개사 운영) | P0 | 승인 리드타임, 승인율, 위반율 | 14~20주 |
| V2 | 허위매물 신고/제재 상태머신 | 네이버/직방(신뢰 체계) | P0 | 신고 처리 SLA, 재발률 | 16~22주 |
| V2 | 리드/노출 상품(중개사) | 직방/다방(B2B 전환) | P1 | 리드 전환율, ARPU | 18~24주 |
| V3 | 대화형 검색(AI) | 직방 AI중개사 | P2 | 쿼리 성공률, 검색 이탈률 | 24주+ |
| V3 | 고급 투어/콘텐츠 | 직방(3D/VR), 네이버(VR 탐색) | P2 | 콘텐츠 소비시간, 문의 전환율 | 24주+ |

### 12.3 기능별 책임 경계
1. 데이터팀: 수집/정규화/지표 산출
2. API팀: 검색/지도/상세/캐시/성능
3. 플랫폼팀: 인증/권한/감사로그/정책
4. 프론트팀: 탐색 UX/알림/전환

### 12.4 KPI 대시보드 최소 세트
1. 트래픽/퍼널
   - 방문 -> 검색 -> 상세 -> 문의
2. 신뢰/품질
   - API 오류율, 데이터 누락률, 신고 처리 SLA
3. 비즈니스
   - 재방문율, 알림 유지율, 리드 전환율
4. 운영
   - 검수 대기열, 평균 처리시간, 정책 위반 재발률

### 12.5 스코프 제어 규칙
1. P0 미완료 상태에서 P2 신규 착수 금지
2. 성능 SLO 미달이면 기능 추가보다 성능 개선 우선
3. 운영 정책(신고/제재/인증) 문서 없이 배포 금지
