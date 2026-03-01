# Launch Gate Report - 2026-03-01

- baseUrl: http://localhost:3000
- startedAt: 2026-03-01T05:42:14.732Z
- total: 8
- passed: 8
- result: PASS

## Regression Checks
- [PASS] home / (expect 200, got 200, 2402ms)
- [PASS] search /api/search?q=%EB%9E%98%EB%AF%B8%EC%95%88&page=1&size=5 (expect 200, got 200, 1883ms)
- [PASS] map /api/map/complexes?sw_lat=37.0&sw_lng=126.4&ne_lat=37.8&ne_lng=127.5&limit=5 (expect 200, got 200, 1818ms)
- [PASS] complex_valid /api/complexes/1 (expect 200, got 200, 2062ms)
- [PASS] complex_not_found /api/complexes/9999 (expect 404, got 404, 278ms)
- [PASS] complex_bad_id /api/complexes/abc (expect 400, got 400, 27ms)
- [PASS] complex_deals /api/complexes/1/deals?page=1&size=20 (expect 200, got 200, 1831ms)
- [PASS] detail_page /complexes/1 (expect 200, got 200, 3219ms)

## Lighthouse Mobile
- Run: `npm run qa:lighthouse:mobile`
- Output: `docs/lighthouse-mobile.html`
