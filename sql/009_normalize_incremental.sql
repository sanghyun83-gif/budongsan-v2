-- 009_normalize_incremental.sql
-- Incremental normalize by raw_id watermark

BEGIN;

CREATE TABLE IF NOT EXISTS pipeline_state (
  state_key VARCHAR(80) PRIMARY KEY,
  value_text TEXT,
  value_bigint BIGINT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO pipeline_state (state_key, value_text, value_bigint)
VALUES ('normalize_last_raw_id', '0', 0)
ON CONFLICT (state_key) DO NOTHING;

WITH st AS (
  SELECT COALESCE(value_bigint, 0) AS last_raw_id
  FROM pipeline_state
  WHERE state_key = 'normalize_last_raw_id'
  FOR UPDATE
),
src AS (
  SELECT
    r.id AS raw_id,
    r.complex_id,
    to_date(NULLIF(r.payload_json->>'deal_ymd', ''), 'YYYYMMDD') AS deal_date,
    NULLIF(regexp_replace(COALESCE(r.payload_json->>'deal_amount_manwon', ''), '[^0-9]', '', 'g'), '')::INTEGER AS deal_amount_manwon,
    NULLIF(regexp_replace(COALESCE(r.payload_json->>'area_m2', ''), '[^0-9\.]', '', 'g'), '')::NUMERIC(8,2) AS area_m2,
    NULLIF(regexp_replace(COALESCE(r.payload_json->>'floor', ''), '[^0-9\-]', '', 'g'), '')::INTEGER AS floor,
    NULLIF(regexp_replace(COALESCE(r.payload_json->>'build_year', ''), '[^0-9]', '', 'g'), '')::INTEGER AS build_year
  FROM deal_trade_raw r
  CROSS JOIN st
  WHERE r.id > st.last_raw_id
    AND r.complex_id IS NOT NULL
),
inserted AS (
  INSERT INTO deal_trade_normalized (
    complex_id, deal_date, deal_amount_manwon, area_m2, floor, build_year, source_raw_id
  )
  SELECT
    s.complex_id,
    s.deal_date,
    s.deal_amount_manwon,
    s.area_m2,
    s.floor,
    s.build_year,
    s.raw_id
  FROM src s
  WHERE s.deal_date IS NOT NULL
    AND s.deal_amount_manwon IS NOT NULL
    AND s.area_m2 IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM deal_trade_normalized n WHERE n.source_raw_id = s.raw_id
    )
  RETURNING source_raw_id
),
max_seen AS (
  SELECT COALESCE(MAX(raw_id), (SELECT last_raw_id FROM st)) AS max_raw_id
  FROM src
)
UPDATE pipeline_state p
SET
  value_bigint = m.max_raw_id,
  value_text = m.max_raw_id::text,
  updated_at = NOW()
FROM max_seen m
WHERE p.state_key = 'normalize_last_raw_id';

COMMIT;
