# Boodongsan Real Estate API Usage

## Base
- Base URL: `https://sootja.kr/realestate`
- Docs: `https://sootja.kr/realestate/docs`
- OpenAPI JSON: `https://sootja.kr/realestate/openapi.json`

## Authentication
This API uses query-parameter API key auth.

- Required on all data endpoints: `api_key=YOUR_API_KEY`
- Example:
  - `https://sootja.kr/realestate/v1/health?api_key=YOUR_API_KEY`

If missing/invalid, response is:
- `401 {"detail":"Invalid API key"}`

## Common response shape
```json
{
  "items": [ ... ],
  "page": 1,
  "page_size": 50,
  "total": 12345
}
```

## Pagination
- `page` (min: 1)
- `page_size` (min: 1, max: 9999)

## Endpoints

### Health / Meta
- `GET /v1/health`
- `GET /v1/meta`

### Dasaedae (multi-household)
- `GET /v1/dasaedae/rent`
- `GET /v1/dasaedae/trade`
- `GET /v1/dasaedae/rent/search`
- `GET /v1/dasaedae/trade/search`

### Officetel
- `GET /v1/officetel/rent`
- `GET /v1/officetel/trade`
- `GET /v1/officetel/rent/search`
- `GET /v1/officetel/trade/search`

### Combined complex search
- `GET /v1/search`
  - Finds matching complex names across all 4 datasets.
  - Returns grouped rows with: `property_type`, `complex_name`, `rent_count`, `trade_count`, `total_count`, `sggcd_list`, `umdnm_list`, `jibun_list`.
  - Note: `page_size` max is `1000` on this endpoint.

### Combined records (rent + trade in one call)
- `GET /v1/complex/records`
  - Returns both `rent` and `trade` blocks for one complex.
  - Required params: `property_type` (`dasaedae` or `officetel`), `complex_name`.

## Main query parameters

### Shared filters
- `sggCd`, `sggNm`, `umdNm`, `jibun`
- `deal_ymd_from`, `deal_ymd_to`
- `page`, `page_size`
- `sort`: `deal_ymd`, `deal_ymd:desc`, `deal_ymd:asc`, `dealYear:desc`, `dealYear:asc`

### Name filters
- Dasaedae: `mhouseNm`
- Officetel: `offiNm`
- Search endpoints: `q` (contains search), optional `dong` (jibun/dong narrowing)

### Numeric range filters
- Rent: `min_deposit`, `max_deposit`, `min_monthlyRent`, `max_monthlyRent`
- Trade: `min_dealAmount`, `max_dealAmount`

## Working examples

### Health
```bash
curl "https://sootja.kr/realestate/v1/health?api_key=YOUR_API_KEY"
```

### Search by complex name (Korean)
```bash
curl "https://sootja.kr/realestate/v1/dasaedae/rent/search?api_key=YOUR_API_KEY&q=%EB%8D%94%EA%B0%80%EC%98%A8&page=1&page_size=20"
```

### Combined search across dasaedae + officetel
```bash
curl "https://sootja.kr/realestate/v1/search?api_key=YOUR_API_KEY&q=%EB%8D%94%EA%B0%80%EC%98%A8&page=1&page_size=20"
```

### Combined records for one complex (rent + trade)
```bash
curl "https://sootja.kr/realestate/v1/complex/records?api_key=YOUR_API_KEY&property_type=dasaedae&complex_name=%EB%8D%94%EA%B0%80%EC%98%A8102%EB%8F%99&page=1&page_size=9999"
```

### Search with optional dong narrowing
```bash
curl "https://sootja.kr/realestate/v1/dasaedae/rent/search?api_key=YOUR_API_KEY&q=%EB%8D%94%EA%B0%80%EC%98%A8&dong=126-28&page=1&page_size=20"
```

### Single complex all rent rows
```bash
curl "https://sootja.kr/realestate/v1/dasaedae/rent?api_key=YOUR_API_KEY&mhouseNm=%ED%98%84%EB%8C%80%EB%B9%8C%EB%9D%BC&page=1&page_size=9999"
```

### Single complex all trade rows
```bash
curl "https://sootja.kr/realestate/v1/dasaedae/trade?api_key=YOUR_API_KEY&mhouseNm=%ED%98%84%EB%8C%80%EB%B9%8C%EB%9D%BC&page=1&page_size=9999"
```

### Windows (cmd) speed check example
```bat
curl -sS -o NUL -w "total_s=%{time_total}\n" "https://sootja.kr/realestate/v1/search?api_key=YOUR_API_KEY&q=%EB%8D%94%EA%B0%80%EC%98%A8&page=1&page_size=20"
```

## Node.js example
```js
const apiKey = process.env.BOODONGSAN_API_KEY;
const url = `https://sootja.kr/realestate/v1/dasaedae/rent/search?api_key=${apiKey}&q=${encodeURIComponent('더가온')}&page=1&page_size=20`;

const res = await fetch(url);
if (!res.ok) throw new Error(`HTTP ${res.status}`);
const data = await res.json();
console.log(data.total, data.items.length);
```

## Notes for agentic/code LLMs
1. Always include `api_key`.
2. Always URL-encode Korean text.
3. Start with smaller `page_size` for exploration, then scale up.
4. Use narrow filters (`mhouseNm`, `sggCd`, date range) for faster queries.
5. Read schema from `/realestate/openapi.json` before generating code.
