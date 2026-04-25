# APT_RENT_API_VERIFY_2026-04-25

## 요청 정보
- 서비스: `RTMSDataSvcAptRent` (아파트 전월세)
- 검증 기준 파라미터
  - `LAWD_CD=11110` (법정동코드 앞 5자리)
  - `DEAL_YMD=201512` (계약년월 6자리)
  - `serviceKey=<DATA_GO_KR_API_KEY>`

## 엔드포인트 검증 결과
1. 실패 URL
- `https://apis.data.go.kr/1613000/RTMSDataSvcAptRent`
- 결과: `HTTP 500`, 본문 `Unexpected errors`

2. 정상 URL ✅
- `https://apis.data.go.kr/1613000/RTMSDataSvcAptRent/getRTMSDataSvcAptRent`
- 결과: `HTTP 200`, `resultCode=000`, `resultMsg=OK`

## 샘플 응답 확인
- `totalCount=95` (LAWD_CD=11110, DEAL_YMD=201512, numOfRows=1 기준)
- 주요 필드 확인:
  - `deposit` (보증금)
  - `monthlyRent` (월세)
  - `dealYear`, `dealMonth`, `dealDay`
  - `aptNm`, `excluUseAr`, `floor`, `buildYear`
- 샘플 값: `deposit=33,000`, `monthlyRent=0` (전세 케이스)

## 결론
- 월세/전세 API 연동 시 **반드시 아래 URL 사용**:
  - `https://apis.data.go.kr/1613000/RTMSDataSvcAptRent/getRTMSDataSvcAptRent`
- 루트 URL(`.../RTMSDataSvcAptRent`)은 호출 시 500 오류가 발생함.
