-- 006_geocode_backfill.sql
-- Geocoding backfill queue and quality metadata

BEGIN;

ALTER TABLE complex
  ADD COLUMN IF NOT EXISTS geocode_confidence NUMERIC(5,4),
  ADD COLUMN IF NOT EXISTS geocoded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS geocode_provider VARCHAR(30);

CREATE TABLE IF NOT EXISTS geocode_backfill_queue (
  id BIGSERIAL PRIMARY KEY,
  complex_id BIGINT NOT NULL UNIQUE REFERENCES complex(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 5,
  last_error TEXT,
  next_retry_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_tried_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (status IN ('pending', 'success', 'failed', 'permanent_failed'))
);

CREATE INDEX IF NOT EXISTS idx_geocode_queue_status_retry
  ON geocode_backfill_queue(status, next_retry_at);

COMMIT;
