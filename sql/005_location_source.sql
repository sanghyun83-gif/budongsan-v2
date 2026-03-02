-- 005_location_source.sql
-- Add location source quality flag to complex

BEGIN;

ALTER TABLE complex
  ADD COLUMN IF NOT EXISTS location_source VARCHAR(10) NOT NULL DEFAULT 'approx';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ck_complex_location_source'
  ) THEN
    ALTER TABLE complex
      ADD CONSTRAINT ck_complex_location_source
      CHECK (location_source IN ('exact', 'approx'));
  END IF;
END$$;

UPDATE complex
SET location_source = 'approx'
WHERE location_source IS NULL;

COMMIT;