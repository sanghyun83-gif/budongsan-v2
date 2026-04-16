"use client";

export default function CommissionShare({ query }: { query: string }) {
  const onCopy = async () => {
    const url = `${window.location.origin}/commission?${query}`;
    await navigator.clipboard.writeText(url);
    alert("공유 링크가 복사되었습니다.");
  };

  return (
    <button type="button" className="ui-button hub-button-muted" onClick={onCopy}>
      결과 공유 URL 복사
    </button>
  );
}
