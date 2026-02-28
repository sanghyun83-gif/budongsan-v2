-- 003_normalize_from_raw.sql
-- Normalize deal_trade_raw payload into deal_trade_normalized

BEGIN;

WITH src AS (
  SELECT
    r.id AS raw_id,
    r.complex_id,
    to_date(NULLIF(r.payload_json->>'deal_ymd', ''), 'YYYYMMDD') AS deal_date,
    NULLIF(regexp_replace(COALESCE(r.payload_json->>'deal_amount_manwon', ''), '[^0-9]', '', 'g'), '')::INTEGER AS deal_amount_manwon,
    NULLIF(regexp_replace(COALESCE(r.payload_json->>'area_m2', ''), '[^0-9\.]', '', 'g'), '')::NUMERIC(8,2) AS area_m2,
    NULLIF(regexp_replace(COALESCE(r.payload_json->>'floor', ''), '[^0-9\-]', '', 'g'), '')::INTEGER AS floor,
    NULLIF(regexp_replace(COALESCE(r.payload_json->>'build_year', ''), '[^0-9]', '', 'g'), '')::INTEGER AS build_year
  FROM deal_trade_raw r
  WHERE r.complex_id IS NOT NULL
)
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
WHERE
  s.deal_date IS NOT NULL
  AND s.deal_amount_manwon IS NOT NULL
  AND s.area_m2 IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM deal_trade_normalized n WHERE n.source_raw_id = s.raw_id
  );

COMMIT;

