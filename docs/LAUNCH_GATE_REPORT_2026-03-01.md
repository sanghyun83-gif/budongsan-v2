# Launch Gate Report - 2026-03-01

- baseUrl: https://budongsan-v2.vercel.app
- startedAt: 2026-03-01T06:11:10.435Z
- total: 8
- passed: 8
- result: PASS

## Regression Checks
- [PASS] home / (expect 200, got 200, 851ms)
- [PASS] search /api/search?q=%EB%9E%98%EB%AF%B8%EC%95%88&page=1&size=5 (expect 200, got 200, 353ms)
- [PASS] map /api/map/complexes?sw_lat=37.0&sw_lng=126.4&ne_lat=37.8&ne_lng=127.5&limit=5 (expect 200, got 200, 460ms)
- [PASS] complex_valid /api/complexes/1 (expect 200, got 200, 239ms)
- [PASS] complex_not_found /api/complexes/9999 (expect 404, got 404, 229ms)
- [PASS] complex_bad_id /api/complexes/abc (expect 400, got 400, 240ms)
- [PASS] complex_deals /api/complexes/1/deals?page=1&size=20 (expect 200, got 200, 221ms)
- [PASS] detail_page /complexes/1 (expect 200, got 200, 1552ms)

## Lighthouse Mobile
- Run: `npm run qa:lighthouse:mobile`
- Output: `docs/lighthouse-mobile.html`
