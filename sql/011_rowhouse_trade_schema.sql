BEGIN;

CREATE TABLE IF NOT EXISTS deal_rowhouse_trade_raw (
  id BIGSERIAL PRIMARY KEY,
  source_name VARCHAR(40) NOT NULL,
  source_record_hash CHAR(64) NOT NULL UNIQUE,
  region_code VARCHAR(5) NOT NULL,
  deal_ymd VARCHAR(8) NOT NULL,
  payload_json JSONB NOT NULL,
  ingested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  complex_id BIGINT REFERENCES complex(id)
);

CREATE INDEX IF NOT EXISTS idx_deal_rowhouse_trade_raw_region_ymd
  ON deal_rowhouse_trade_raw(region_code, deal_ymd);

CREATE INDEX IF NOT EXISTS idx_deal_rowhouse_trade_raw_payload_gin
  ON deal_rowhouse_trade_raw USING GIN (payload_json);

CREATE TABLE IF NOT EXISTS deal_rowhouse_trade_normalized (
  id BIGSERIAL PRIMARY KEY,
  complex_id BIGINT NOT NULL REFERENCES complex(id),
  deal_date DATE NOT NULL,
  deal_amount_manwon INTEGER NOT NULL,
  area_m2 NUMERIC(8,2) NOT NULL,
  floor INTEGER,
  build_year INTEGER,
  source_raw_id BIGINT REFERENCES deal_rowhouse_trade_raw(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deal_rowhouse_trade_norm_complex_date
  ON deal_rowhouse_trade_normalized(complex_id, deal_date DESC);

CREATE INDEX IF NOT EXISTS idx_deal_rowhouse_trade_norm_date_price
  ON deal_rowhouse_trade_normalized(deal_date DESC, deal_amount_manwon DESC);

CREATE UNIQUE INDEX IF NOT EXISTS uq_deal_rowhouse_trade_norm_source_raw_id
  ON deal_rowhouse_trade_normalized(source_raw_id)
  WHERE source_raw_id IS NOT NULL;

COMMIT;
