-- 004_mvp3_indexes.sql
-- Search/map performance indexes for MVP-3

BEGIN;

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Trigram indexes for ILIKE search
CREATE INDEX IF NOT EXISTS idx_complex_apt_name_trgm
  ON complex USING GIN (apt_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_complex_legal_dong_trgm
  ON complex USING GIN (legal_dong gin_trgm_ops);

-- Region join/filter and freshness
CREATE INDEX IF NOT EXISTS idx_complex_region_updated
  ON complex(region_id, updated_at DESC);

-- Fast latest-deal lookup and count windows
CREATE INDEX IF NOT EXISTS idx_deal_trade_norm_complex_date_id
  ON deal_trade_normalized(complex_id, deal_date DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_deal_trade_norm_complex_amount_date
  ON deal_trade_normalized(complex_id, deal_amount_manwon DESC, deal_date DESC);

-- Raw ingest monitoring
CREATE INDEX IF NOT EXISTS idx_deal_trade_raw_ingested_at
  ON deal_trade_raw(ingested_at DESC);

COMMIT;
