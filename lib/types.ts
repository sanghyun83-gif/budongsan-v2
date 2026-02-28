export interface ApartmentDeal {
  aptId: string;
  regionCode: string;
  aptName: string;
  legalDong: string;
  dealAmount: number; // KRW 만원 unit from data.go.kr
  dealYear: number;
  dealMonth: number;
  dealDay: number;
  areaM2: number;
  floor: number;
  buildYear: number;
}

export interface Sigungu {
  code: string;
  sido: "seoul" | "gyeonggi";
  slug: string;
  nameKo: string;
}

export interface MapComplex {
  aptId: string;
  aptName: string;
  legalDong: string;
  dealAmount: number;
  lat: number;
  lng: number;
}

