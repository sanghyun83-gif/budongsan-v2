# API Specification - budongsan-v2

- Version: v1.0
- Date: 2026-02-28
- Base URL (local): `http://localhost:3000`

## 1. 공통 규약

### 1.1 Response Envelope
성공:
```json
{ "ok": true, "count": 10, "data": [] }
```

실패:
```json
{ "ok": false, "error": "message", "code": "BAD_REQUEST" }
```

### 1.2 Error Code
1. `BAD_REQUEST` - 입력 검증 실패
2. `UPSTREAM_ERROR` - 외부 API 오류
3. `INTERNAL_ERROR` - 서버 내부 오류

### 1.3 Validation
- 모든 query/body 입력은 zod 검증
- 잘못된 입력은 HTTP 400

## 2. Endpoints

## 2.1 GET /api/deals
지역 실거래를 조회한다.

### Query Parameters
1. `region` (string, required): 5자리 지역코드 (예: `11680`)
2. `months` (number, optional, default=3, range 1~12)
3. `limit` (number, optional, default=50, range 1~200)
4. `sort` (string, optional, enum: `recent`, `top`, default=`recent`)

### Example Request
```http
GET /api/deals?region=11680&months=3&limit=20&sort=top
```

### Success Response (200)
```json
{
  "ok": true,
  "count": 20,
  "deals": [
    {
      "aptId": "11680-example-apt",
      "regionCode": "11680",
      "aptName": "Example",
      "legalDong": "역삼동",
      "dealAmount": 250000,
      "dealYear": 2026,
      "dealMonth": 2,
      "dealDay": 4,
      "areaM2": 84.9,
      "floor": 15,
      "buildYear": 2018
    }
  ]
}
```

### Failure Response (400)
```json
{ "ok": false, "error": "Invalid region", "code": "BAD_REQUEST" }
```

## 2.2 GET /api/map/complexes
지도 bbox 기준 단지 목록을 조회한다.

### Query Parameters
1. `sw_lat` (number, required)
2. `sw_lng` (number, required)
3. `ne_lat` (number, required)
4. `ne_lng` (number, required)

### Example Request
```http
GET /api/map/complexes?sw_lat=37.0&sw_lng=126.4&ne_lat=37.8&ne_lng=127.5
```

### Success Response (200)
```json
{
  "ok": true,
  "count": 120,
  "complexes": [
    {
      "aptId": "11680-example-apt",
      "aptName": "Example",
      "legalDong": "역삼동",
      "dealAmount": 250000,
      "lat": 37.51,
      "lng": 127.03
    }
  ]
}
```

### Failure Response (500)
```json
{ "ok": false, "error": "Failed to fetch complexes", "code": "INTERNAL_ERROR" }
```

## 3. Planned Endpoints (Next)

## 3.1 GET /api/search
- 목적: 키워드 + 범위 + 가격 기반 검색
- Query: `q`, `region`, `min_price`, `max_price`, `page`, `size`

## 3.2 GET /api/complexes/:id
- 목적: 단지 기본 정보 조회

## 3.3 GET /api/complexes/:id/deals
- 목적: 단지 거래 히스토리 조회

## 4. Data Contract (TypeScript)

```ts
interface ApartmentDeal {
  aptId: string;
  regionCode: string;
  aptName: string;
  legalDong: string;
  dealAmount: number;
  dealYear: number;
  dealMonth: number;
  dealDay: number;
  areaM2: number;
  floor: number;
  buildYear: number;
}

interface MapComplex {
  aptId: string;
  aptName: string;
  legalDong: string;
  dealAmount: number;
  lat: number;
  lng: number;
}
```

## 5. Performance/SLO
1. `/api/deals` p95 < 700ms (cache hit 기준)
2. `/api/map/complexes` p95 < 500ms (cache hit 기준)
3. Error rate < 1%

## 6. Test Checklist
1. 정상 파라미터로 200 응답
2. 비정상 파라미터로 400 응답
3. 키 미설정 시 에러 응답 확인
4. 응답 스키마 고정 검증

## 7. Local Verification
1. `npm run dev`
2. `curl "http://localhost:3000/api/deals?region=11680&sort=top"`
3. `curl "http://localhost:3000/api/map/complexes?sw_lat=37.0&sw_lng=126.4&ne_lat=37.8&ne_lng=127.5"`
4. `npm run lint`
5. `npm run build`
