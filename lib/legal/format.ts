export function formatKrw(value: number): string {
  return `${Math.round(value).toLocaleString("ko-KR")}원`;
}

export function formatManwon(value: number): string {
  return `${Math.round(value).toLocaleString("ko-KR")}만원`;
}
