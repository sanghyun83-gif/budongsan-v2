export type SootjaPropertyType = "apartment" | "dasaedae" | "officetel";

export interface SootjaPaged<T> {
  items: T[];
  page: number;
  page_size: number;
  total: number;
}

export interface SootjaCombinedSearchItem {
  property_type: SootjaPropertyType;
  complex_name: string;
  rent_count: number;
  trade_count: number;
  total_count: number;
  sggcd_list: string[];
  umdnm_list: string[];
  jibun_list: string[];
  primary_jibun?: string;
}

export type SootjaCombinedSearchResponse = SootjaPaged<SootjaCombinedSearchItem>;

export interface SootjaDealItem {
  sggcd?: string;
  umdnm?: string;
  jibun?: string;
  deal_ymd?: string;
  dealyear?: string;
  dealmonth?: string;
  dealday?: string;
  dealamount?: string;
  buildyear?: string;
  excluusear?: string;
  floor?: string;
  mhousenm?: string;
  offinm?: string;
}

export interface SootjaRentItem {
  sggcd?: string;
  umdnm?: string;
  jibun?: string;
  deal_ymd?: string;
  dealyear?: string;
  dealmonth?: string;
  dealday?: string;
  deposit?: string;
  monthlyrent?: string;
  buildyear?: string;
  excluusear?: string;
  floor?: string;
  mhousenm?: string;
  offinm?: string;
}

export interface SootjaComplexRecordsResponse {
  property_type: SootjaPropertyType;
  complex_name: string;
  jibun?: string;
  trade: SootjaPaged<SootjaDealItem>;
  rent: SootjaPaged<SootjaRentItem>;
  links?: Record<string, string>;
}
