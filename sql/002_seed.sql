-- 002_seed.sql
-- Minimal seed data for MVP-1 API verification

BEGIN;

INSERT INTO region (code, sido, sigungu, name_ko)
VALUES
  ('11680', 'seoul', 'gangnam', '강남구'),
  ('11650', 'seoul', 'seocho', '서초구'),
  ('11710', 'seoul', 'songpa', '송파구')
ON CONFLICT (code) DO UPDATE SET
  sido = EXCLUDED.sido,
  sigungu = EXCLUDED.sigungu,
  name_ko = EXCLUDED.name_ko;

INSERT INTO complex (
  region_id,
  external_key,
  apt_name,
  legal_dong,
  address_road,
  address_jibun,
  location,
  build_year,
  total_units
)
VALUES
  (
    (SELECT id FROM region WHERE code = '11680'),
    'seed-11680-raemian-daechi',
    '래미안 대치팰리스',
    '대치동',
    '서울 강남구 삼성로 212',
    '서울 강남구 대치동 1027',
    ST_SetSRID(ST_MakePoint(127.0605, 37.4946), 4326),
    2015,
    1608
  ),
  (
    (SELECT id FROM region WHERE code = '11650'),
    'seed-11650-raemian-seocho',
    '래미안 원베일리',
    '반포동',
    '서울 서초구 반포대로 275',
    '서울 서초구 반포동 1-1',
    ST_SetSRID(ST_MakePoint(127.0057, 37.5105), 4326),
    2023,
    2990
  ),
  (
    (SELECT id FROM region WHERE code = '11710'),
    'seed-11710-helio-city',
    '헬리오시티',
    '가락동',
    '서울 송파구 송파대로 345',
    '서울 송파구 가락동 913',
    ST_SetSRID(ST_MakePoint(127.1140, 37.4973), 4326),
    2018,
    9510
  )
ON CONFLICT (region_id, apt_name, legal_dong) DO UPDATE SET
  external_key = EXCLUDED.external_key,
  address_road = EXCLUDED.address_road,
  address_jibun = EXCLUDED.address_jibun,
  location = EXCLUDED.location,
  build_year = EXCLUDED.build_year,
  total_units = EXCLUDED.total_units,
  updated_at = NOW();

INSERT INTO deal_trade_normalized (
  complex_id,
  deal_date,
  deal_amount_manwon,
  area_m2,
  floor,
  build_year
)
VALUES
  (
    (SELECT c.id FROM complex c JOIN region r ON r.id = c.region_id WHERE r.code = '11680' AND c.apt_name = '래미안 대치팰리스' AND c.legal_dong = '대치동'),
    DATE '2026-02-10',
    380000,
    84.99,
    21,
    2015
  ),
  (
    (SELECT c.id FROM complex c JOIN region r ON r.id = c.region_id WHERE r.code = '11650' AND c.apt_name = '래미안 원베일리' AND c.legal_dong = '반포동'),
    DATE '2026-02-08',
    450000,
    84.96,
    18,
    2023
  ),
  (
    (SELECT c.id FROM complex c JOIN region r ON r.id = c.region_id WHERE r.code = '11710' AND c.apt_name = '헬리오시티' AND c.legal_dong = '가락동'),
    DATE '2026-02-03',
    260000,
    84.98,
    25,
    2018
  )
ON CONFLICT DO NOTHING;

COMMIT;
