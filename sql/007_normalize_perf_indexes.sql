-- 007_normalize_perf_indexes.sql
-- Performance indexes + constraints for incremental normalize

BEGIN;

-- Clean up historical duplicates before unique index creation.
WITH ranked AS (
  SELECT
    id,
    source_raw_id,
    ROW_NUMBER() OVER (PARTITION BY source_raw_id ORDER BY id) AS rn
  FROM deal_trade_normalized
  WHERE source_raw_id IS NOT NULL
)
DELETE FROM deal_trade_normalized d
USING ranked r
WHERE d.id = r.id
  AND r.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS uq_deal_trade_norm_source_raw_id
  ON deal_trade_normalized(source_raw_id)
  WHERE source_raw_id IS NOT NULL;

-- Incremental scan pattern: id > watermark and complex_id IS NOT NULL
CREATE INDEX IF NOT EXISTS idx_deal_trade_raw_id_with_complex
  ON deal_trade_raw(id)
  WHERE complex_id IS NOT NULL;

COMMIT;
