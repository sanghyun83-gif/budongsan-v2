-- 008_pipeline_state.sql
-- Generic pipeline watermark state table

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

COMMIT;
