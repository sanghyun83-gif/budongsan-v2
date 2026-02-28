# ERD (Entity-Relationship Diagram) - budongsan-v2

- Version: v1.0
- Date: 2026-02-28
- Scope: MVP -> V1 -> V2
- DB Target: PostgreSQL + PostGIS

## 1. 설계 원칙
1. Raw(원본)와 Normalized(정규화)를 분리한다.
2. 거래 원본은 append-only로 보관한다.
3. 공간 검색은 PostGIS(`geometry(Point,4326)`)를 표준으로 한다.
4. 운영 이벤트(인증/신고/제재)는 감사로그로 추적 가능해야 한다.

## 2. 엔티티 목록

### Core (MVP)
1. `region` - 시도/시군구 기준 행정구역
2. `complex` - 단지 마스터
3. `deal_trade_raw` - 외부 API 원본 거래
4. `deal_trade_normalized` - 정규화 거래

### Product (V1)
1. `user_account` - 사용자 계정
2. `favorite_complex` - 관심단지
3. `alert_subscription` - 알림 구독
4. `complex_metric_daily` - 단지 일별 지표

### Platform/Trust (V2)
1. `agent` - 중개사 프로필
2. `agent_verification` - 중개사 인증/KYC 상태
3. `listing` - 매물
4. `listing_report` - 신고
5. `moderation_action` - 제재/처리 결과
6. `audit_log` - 감사로그

## 3. 관계 다이어그램 (텍스트)

```txt
region (1) ----- (N) complex
complex (1) ---- (N) deal_trade_raw
complex (1) ---- (N) deal_trade_normalized

user_account (1) ---- (N) favorite_complex ---- (N) complex
user_account (1) ---- (N) alert_subscription -- (N) complex
complex (1) ------ (N) complex_metric_daily

user_account (1) ---- (0..1) agent
agent (1) ----------- (N) agent_verification
agent (1) ----------- (N) listing
listing (1) --------- (N) listing_report
listing_report (1) -- (N) moderation_action

user_account/agent/admin actions -> audit_log (N)
```

## 4. 테이블 상세

## 4.1 region
- PK: `id`
- Unique: `(code)`

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | BIGSERIAL | PK | 내부 ID |
| code | VARCHAR(10) | NOT NULL, UNIQUE | 행정구역 코드 |
| sido | VARCHAR(20) | NOT NULL | 예: seoul, gyeonggi |
| sigungu | VARCHAR(80) | NULL | 구/시군명 |
| name_ko | VARCHAR(120) | NOT NULL | 한글명 |
| created_at | TIMESTAMPTZ | NOT NULL | 생성 시각 |

## 4.2 complex
- PK: `id`
- FK: `region_id -> region.id`
- Unique: `(region_id, apt_name, legal_dong)`

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | BIGSERIAL | PK | 단지 ID |
| region_id | BIGINT | FK, NOT NULL | 행정구역 참조 |
| external_key | VARCHAR(120) | NULL | 외부 연계키 |
| apt_name | VARCHAR(200) | NOT NULL | 단지명 |
| legal_dong | VARCHAR(120) | NULL | 법정동 |
| address_road | TEXT | NULL | 도로명 주소 |
| address_jibun | TEXT | NULL | 지번 주소 |
| location | geometry(Point,4326) | NULL | 위경도 |
| build_year | INTEGER | NULL | 준공연도 |
| total_units | INTEGER | NULL | 세대수 |
| created_at | TIMESTAMPTZ | NOT NULL | 생성 시각 |
| updated_at | TIMESTAMPTZ | NOT NULL | 수정 시각 |

인덱스:
1. `GIST(location)`
2. `(region_id, apt_name)`

## 4.3 deal_trade_raw (append-only)
- PK: `id`
- FK: `complex_id -> complex.id`
- Unique 권장: `(source_name, source_record_hash)`

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | BIGSERIAL | PK | 원본 거래 ID |
| source_name | VARCHAR(40) | NOT NULL | `molit` 등 |
| source_record_hash | CHAR(64) | NOT NULL | 중복 방지 해시 |
| region_code | VARCHAR(5) | NOT NULL | API 지역 코드 |
| deal_ymd | VARCHAR(8) | NOT NULL | 거래일 yyyymmdd |
| payload_json | JSONB | NOT NULL | 원본 payload |
| ingested_at | TIMESTAMPTZ | NOT NULL | 수집 시각 |
| complex_id | BIGINT | FK NULL | 매핑된 단지 |

인덱스:
1. `(region_code, deal_ymd)`
2. `GIN(payload_json)`

## 4.4 deal_trade_normalized
- PK: `id`
- FK: `complex_id -> complex.id`

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | BIGSERIAL | PK | 정규화 거래 ID |
| complex_id | BIGINT | FK, NOT NULL | 단지 참조 |
| deal_date | DATE | NOT NULL | 거래일 |
| deal_amount_manwon | INTEGER | NOT NULL | 거래금액(만원) |
| area_m2 | NUMERIC(8,2) | NOT NULL | 전용면적 |
| floor | INTEGER | NULL | 층 |
| build_year | INTEGER | NULL | 건축년도 |
| source_raw_id | BIGINT | FK NULL | raw 참조 |
| created_at | TIMESTAMPTZ | NOT NULL | 생성 시각 |

인덱스:
1. `(complex_id, deal_date DESC)`
2. `(deal_date DESC, deal_amount_manwon DESC)`

## 4.5 user_account (V1)

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | BIGSERIAL | PK | 사용자 ID |
| email | CITEXT | UNIQUE, NULL | 이메일 |
| oauth_provider | VARCHAR(30) | NULL | google/kakao/naver |
| oauth_sub | VARCHAR(120) | NULL | provider user id |
| nickname | VARCHAR(80) | NULL | 닉네임 |
| role | VARCHAR(20) | NOT NULL | user/admin |
| status | VARCHAR(20) | NOT NULL | active/suspended |
| created_at | TIMESTAMPTZ | NOT NULL | 생성 시각 |

## 4.6 favorite_complex (V1)
- FK: `user_id -> user_account.id`
- FK: `complex_id -> complex.id`
- Unique: `(user_id, complex_id)`

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | BIGSERIAL | PK | 즐겨찾기 ID |
| user_id | BIGINT | FK, NOT NULL | 사용자 |
| complex_id | BIGINT | FK, NOT NULL | 단지 |
| created_at | TIMESTAMPTZ | NOT NULL | 생성 시각 |

## 4.7 alert_subscription (V1)

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | BIGSERIAL | PK | 알림 구독 ID |
| user_id | BIGINT | FK, NOT NULL | 사용자 |
| complex_id | BIGINT | FK, NOT NULL | 단지 |
| min_price | INTEGER | NULL | 하한 |
| max_price | INTEGER | NULL | 상한 |
| channels | TEXT[] | NOT NULL | email/push/webhook |
| status | VARCHAR(20) | NOT NULL | active/paused |
| created_at | TIMESTAMPTZ | NOT NULL | 생성 시각 |

## 4.8 complex_metric_daily (V1)
- Unique: `(complex_id, metric_date)`

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | BIGSERIAL | PK | 지표 ID |
| complex_id | BIGINT | FK, NOT NULL | 단지 |
| metric_date | DATE | NOT NULL | 기준일 |
| deal_count_30d | INTEGER | NOT NULL | 최근 30일 거래수 |
| avg_price_manwon | INTEGER | NULL | 평균 거래가 |
| p50_price_manwon | INTEGER | NULL | 중위가격 |
| p95_price_manwon | INTEGER | NULL | 상위가격 |
| price_change_3m_pct | NUMERIC(6,2) | NULL | 3개월 증감률 |
| updated_at | TIMESTAMPTZ | NOT NULL | 갱신 시각 |

## 4.9 agent (V2)
- FK: `user_id -> user_account.id`
- Unique: `user_id`

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | BIGSERIAL | PK | 중개사 ID |
| user_id | BIGINT | FK, NOT NULL, UNIQUE | 계정 참조 |
| office_name | VARCHAR(200) | NOT NULL | 중개사무소명 |
| registration_no | VARCHAR(80) | NOT NULL | 등록번호 |
| phone | VARCHAR(30) | NULL | 연락처 |
| region_id | BIGINT | FK NULL | 활동 지역 |
| status | VARCHAR(20) | NOT NULL | pending/active/suspended |
| created_at | TIMESTAMPTZ | NOT NULL | 생성 시각 |

## 4.10 agent_verification (V2)
- FK: `agent_id -> agent.id`

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | BIGSERIAL | PK | 인증 이력 ID |
| agent_id | BIGINT | FK, NOT NULL | 중개사 |
| step | VARCHAR(40) | NOT NULL | doc_check/identity_check 등 |
| status | VARCHAR(20) | NOT NULL | pending/reviewing/approved/rejected |
| reviewer_user_id | BIGINT | FK NULL | 검수자 |
| reason | TEXT | NULL | 반려/제재 사유 |
| evidence_url | TEXT | NULL | 증빙 파일 |
| created_at | TIMESTAMPTZ | NOT NULL | 생성 시각 |

## 4.11 listing (V2)
- FK: `agent_id -> agent.id`
- FK: `complex_id -> complex.id`

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | BIGSERIAL | PK | 매물 ID |
| agent_id | BIGINT | FK, NOT NULL | 등록 중개사 |
| complex_id | BIGINT | FK, NOT NULL | 단지 |
| listing_type | VARCHAR(20) | NOT NULL | sale/jeonse/monthly |
| price_manwon | INTEGER | NOT NULL | 가격 |
| rent_manwon | INTEGER | NULL | 월세 |
| area_m2 | NUMERIC(8,2) | NOT NULL | 면적 |
| floor | INTEGER | NULL | 층 |
| status | VARCHAR(20) | NOT NULL | active/hidden/closed |
| verified_level | VARCHAR(20) | NULL | owner_confirmed 등 |
| created_at | TIMESTAMPTZ | NOT NULL | 생성 시각 |
| updated_at | TIMESTAMPTZ | NOT NULL | 수정 시각 |

## 4.12 listing_report (V2)
- FK: `listing_id -> listing.id`
- FK: `reporter_user_id -> user_account.id`

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | BIGSERIAL | PK | 신고 ID |
| listing_id | BIGINT | FK, NOT NULL | 대상 매물 |
| reporter_user_id | BIGINT | FK NULL | 신고자 |
| reason_code | VARCHAR(40) | NOT NULL | fake/dup/price_mismatch 등 |
| detail | TEXT | NULL | 상세 내용 |
| status | VARCHAR(20) | NOT NULL | received/reviewing/resolved/rejected |
| created_at | TIMESTAMPTZ | NOT NULL | 신고 시각 |

## 4.13 moderation_action (V2)
- FK: `report_id -> listing_report.id`

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | BIGSERIAL | PK | 처리 ID |
| report_id | BIGINT | FK, NOT NULL | 신고 참조 |
| action_type | VARCHAR(40) | NOT NULL | warn/hide/suspend/restore |
| actor_user_id | BIGINT | FK NULL | 처리자 |
| action_detail | TEXT | NULL | 처리 내용 |
| created_at | TIMESTAMPTZ | NOT NULL | 처리 시각 |

## 4.14 audit_log (V2)

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | BIGSERIAL | PK | 로그 ID |
| actor_type | VARCHAR(20) | NOT NULL | user/agent/admin/system |
| actor_id | BIGINT | NULL | 행위자 ID |
| target_type | VARCHAR(40) | NOT NULL | listing/report/agent 등 |
| target_id | BIGINT | NULL | 대상 ID |
| event_name | VARCHAR(80) | NOT NULL | 이벤트명 |
| before_json | JSONB | NULL | 변경 전 |
| after_json | JSONB | NULL | 변경 후 |
| ip_addr | INET | NULL | IP |
| created_at | TIMESTAMPTZ | NOT NULL | 이벤트 시각 |

인덱스:
1. `(target_type, target_id, created_at DESC)`
2. `(actor_type, actor_id, created_at DESC)`

## 5. 상태머신 (V2)

## 5.1 agent_verification.status
`pending -> reviewing -> approved`
`pending/reviewing -> rejected`
`approved -> suspended -> approved`

## 5.2 listing_report.status
`received -> reviewing -> resolved`
`received/reviewing -> rejected`

## 6. 마이그레이션 순서 권장
1. `region`, `complex`
2. `deal_trade_raw`, `deal_trade_normalized`
3. `user_account`, `favorite_complex`, `alert_subscription`, `complex_metric_daily`
4. `agent`, `agent_verification`, `listing`, `listing_report`, `moderation_action`, `audit_log`

## 7. 최소 SQL 예시

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE region (
  id BIGSERIAL PRIMARY KEY,
  code VARCHAR(10) NOT NULL UNIQUE,
  sido VARCHAR(20) NOT NULL,
  sigungu VARCHAR(80),
  name_ko VARCHAR(120) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE complex (
  id BIGSERIAL PRIMARY KEY,
  region_id BIGINT NOT NULL REFERENCES region(id),
  apt_name VARCHAR(200) NOT NULL,
  legal_dong VARCHAR(120),
  location geometry(Point, 4326),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(region_id, apt_name, legal_dong)
);

CREATE INDEX idx_complex_location_gist ON complex USING GIST (location);
```

## 8. 완료 기준 (DoD)
1. ERD 문서와 실제 마이그레이션 파일이 일치한다.
2. bbox 질의 `EXPLAIN ANALYZE` 결과가 기준 성능을 만족한다.
3. 상태머신 전이 규칙이 API 계층에서 강제된다.
4. 감사로그 누락 없이 운영 이벤트가 기록된다.
