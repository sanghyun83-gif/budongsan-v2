-- 001_init.sql
-- budongsan-v2 initial schema (PostgreSQL + PostGIS)

BEGIN;

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE IF NOT EXISTS region (
  id BIGSERIAL PRIMARY KEY,
  code VARCHAR(10) NOT NULL UNIQUE,
  sido VARCHAR(20) NOT NULL,
  sigungu VARCHAR(80),
  name_ko VARCHAR(120) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS complex (
  id BIGSERIAL PRIMARY KEY,
  region_id BIGINT NOT NULL REFERENCES region(id),
  external_key VARCHAR(120),
  apt_name VARCHAR(200) NOT NULL,
  legal_dong VARCHAR(120),
  address_road TEXT,
  address_jibun TEXT,
  location geometry(Point, 4326),
  build_year INTEGER,
  total_units INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (region_id, apt_name, legal_dong)
);

CREATE INDEX IF NOT EXISTS idx_complex_location_gist ON complex USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_complex_region_name ON complex(region_id, apt_name);

CREATE TABLE IF NOT EXISTS deal_trade_raw (
  id BIGSERIAL PRIMARY KEY,
  source_name VARCHAR(40) NOT NULL,
  source_record_hash CHAR(64) NOT NULL UNIQUE,
  region_code VARCHAR(5) NOT NULL,
  deal_ymd VARCHAR(8) NOT NULL,
  payload_json JSONB NOT NULL,
  ingested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  complex_id BIGINT REFERENCES complex(id)
);

CREATE INDEX IF NOT EXISTS idx_deal_trade_raw_region_ymd ON deal_trade_raw(region_code, deal_ymd);
CREATE INDEX IF NOT EXISTS idx_deal_trade_raw_payload_gin ON deal_trade_raw USING GIN (payload_json);

CREATE TABLE IF NOT EXISTS deal_trade_normalized (
  id BIGSERIAL PRIMARY KEY,
  complex_id BIGINT NOT NULL REFERENCES complex(id),
  deal_date DATE NOT NULL,
  deal_amount_manwon INTEGER NOT NULL,
  area_m2 NUMERIC(8,2) NOT NULL,
  floor INTEGER,
  build_year INTEGER,
  source_raw_id BIGINT REFERENCES deal_trade_raw(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deal_trade_norm_complex_date ON deal_trade_normalized(complex_id, deal_date DESC);
CREATE INDEX IF NOT EXISTS idx_deal_trade_norm_date_price ON deal_trade_normalized(deal_date DESC, deal_amount_manwon DESC);

CREATE TABLE IF NOT EXISTS user_account (
  id BIGSERIAL PRIMARY KEY,
  email CITEXT UNIQUE,
  oauth_provider VARCHAR(30),
  oauth_sub VARCHAR(120),
  nickname VARCHAR(80),
  role VARCHAR(20) NOT NULL DEFAULT 'user',
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS favorite_complex (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES user_account(id),
  complex_id BIGINT NOT NULL REFERENCES complex(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, complex_id)
);

CREATE TABLE IF NOT EXISTS alert_subscription (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES user_account(id),
  complex_id BIGINT NOT NULL REFERENCES complex(id),
  min_price INTEGER,
  max_price INTEGER,
  channels TEXT[] NOT NULL DEFAULT ARRAY['email']::TEXT[],
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS complex_metric_daily (
  id BIGSERIAL PRIMARY KEY,
  complex_id BIGINT NOT NULL REFERENCES complex(id),
  metric_date DATE NOT NULL,
  deal_count_30d INTEGER NOT NULL DEFAULT 0,
  avg_price_manwon INTEGER,
  p50_price_manwon INTEGER,
  p95_price_manwon INTEGER,
  price_change_3m_pct NUMERIC(6,2),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (complex_id, metric_date)
);

CREATE TABLE IF NOT EXISTS agent (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL UNIQUE REFERENCES user_account(id),
  office_name VARCHAR(200) NOT NULL,
  registration_no VARCHAR(80) NOT NULL,
  phone VARCHAR(30),
  region_id BIGINT REFERENCES region(id),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_verification (
  id BIGSERIAL PRIMARY KEY,
  agent_id BIGINT NOT NULL REFERENCES agent(id),
  step VARCHAR(40) NOT NULL,
  status VARCHAR(20) NOT NULL,
  reviewer_user_id BIGINT REFERENCES user_account(id),
  reason TEXT,
  evidence_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS listing (
  id BIGSERIAL PRIMARY KEY,
  agent_id BIGINT NOT NULL REFERENCES agent(id),
  complex_id BIGINT NOT NULL REFERENCES complex(id),
  listing_type VARCHAR(20) NOT NULL,
  price_manwon INTEGER NOT NULL,
  rent_manwon INTEGER,
  area_m2 NUMERIC(8,2) NOT NULL,
  floor INTEGER,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  verified_level VARCHAR(20),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS listing_report (
  id BIGSERIAL PRIMARY KEY,
  listing_id BIGINT NOT NULL REFERENCES listing(id),
  reporter_user_id BIGINT REFERENCES user_account(id),
  reason_code VARCHAR(40) NOT NULL,
  detail TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'received',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS moderation_action (
  id BIGSERIAL PRIMARY KEY,
  report_id BIGINT NOT NULL REFERENCES listing_report(id),
  action_type VARCHAR(40) NOT NULL,
  actor_user_id BIGINT REFERENCES user_account(id),
  action_detail TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_log (
  id BIGSERIAL PRIMARY KEY,
  actor_type VARCHAR(20) NOT NULL,
  actor_id BIGINT,
  target_type VARCHAR(40) NOT NULL,
  target_id BIGINT,
  event_name VARCHAR(80) NOT NULL,
  before_json JSONB,
  after_json JSONB,
  ip_addr INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_target_created_at ON audit_log(target_type, target_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_actor_created_at ON audit_log(actor_type, actor_id, created_at DESC);

COMMIT;
