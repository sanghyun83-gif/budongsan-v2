# Launch Gate Report - 2026-02-28

- baseUrl: http://localhost:3000
- startedAt: 2026-02-28T15:46:43.396Z
- total: 8
- passed: 8
- result: PASS

## Regression Checks
- [PASS] home / (expect 200, got 200, 1328ms)
- [PASS] search /api/search?q=%EB%9E%98%EB%AF%B8%EC%95%88&page=1&size=5 (expect 200, got 200, 2920ms)
- [PASS] map /api/map/complexes?sw_lat=37.0&sw_lng=126.4&ne_lat=37.8&ne_lng=127.5&limit=5 (expect 200, got 200, 512ms)
- [PASS] complex_valid /api/complexes/1 (expect 200, got 200, 1340ms)
- [PASS] complex_not_found /api/complexes/9999 (expect 404, got 404, 228ms)
- [PASS] complex_bad_id /api/complexes/abc (expect 400, got 400, 16ms)
- [PASS] complex_deals /api/complexes/1/deals?page=1&size=20 (expect 200, got 200, 1335ms)
- [PASS] detail_page /complexes/1 (expect 200, got 200, 2796ms)

## Lighthouse Mobile
- Run: `npm run qa:lighthouse:mobile`
- Output: `docs/lighthouse-mobile.html`

## Lighthouse Score Snapshot
- Performance: 69
- Accessibility: 100
- Best Practices: 77
- SEO: 100

