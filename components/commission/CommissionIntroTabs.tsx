"use client";

import { useState } from "react";

const LINKS = [
  ["서울특별시", "https://land.seoul.go.kr:444/land/broker/brokerageCommission.do"],
  ["경기도", "https://gris.gg.go.kr/reb/selectRebRateView.do"],
  ["부산광역시", "https://www.busan.go.kr/depart/ahestateprice01"],
  ["인천광역시", "https://www.incheon.go.kr/build/BU060102/274"],
  ["대전광역시", "https://www.seogu.go.kr/kor/content.do?mnucd=SGMENU0100188"],
  ["세종특별자치시", "https://www.sejong.go.kr/tmpl/pdf.jsp?pdfFilePath=/thumbnail/R0071/BBS_201811211052218120.pdf"],
] as const;

export default function CommissionIntroTabs() {
  const [tab, setTab] = useState<"intro1" | "intro2" | "intro3">("intro1");

  return (
    <section className="legal-card">
      <div style={{ display: "flex", gap: 14, borderBottom: "1px solid #e2e8f0", paddingBottom: 8, marginBottom: 10 }}>
        <button type="button" className="ui-button" style={{ background: tab === "intro1" ? "#0f766e" : "#e2e8f0", color: tab === "intro1" ? "#fff" : "#0f172a" }} onClick={() => setTab("intro1")}>설명</button>
        <button type="button" className="ui-button" style={{ background: tab === "intro2" ? "#0f766e" : "#e2e8f0", color: tab === "intro2" ? "#fff" : "#0f172a" }} onClick={() => setTab("intro2")}>지역별 요율</button>
        <button type="button" className="ui-button" style={{ background: tab === "intro3" ? "#0f766e" : "#e2e8f0", color: tab === "intro3" ? "#fff" : "#0f172a" }} onClick={() => setTab("intro3")}>요율의 상한</button>
      </div>

      {tab === "intro1" && <p style={{ color: "#334155" }}>부동산 매매, 임대차 계약 시 공인중개사에 지불해야 하는 중개보수를 계산합니다.</p>}

      {tab === "intro2" && (
        <div style={{ display: "grid", gap: 8 }}>
          <p style={{ color: "#334155" }}>중개보수 요율은 지역 조례에 따라 달라질 수 있습니다. 아래 링크에서 지역별 최신 고시를 확인하세요.</p>
          <div style={{ maxHeight: 180, overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: 8, padding: 10 }}>
            {LINKS.map(([label, href]) => (
              <p key={href} style={{ marginBottom: 6 }}>
                <a href={href} target="_blank" rel="noopener noreferrer">{label} 부동산중개보수 요율</a>
              </p>
            ))}
          </div>
        </div>
      )}

      {tab === "intro3" && (
        <p style={{ color: "#334155" }}>요율표의 값은 법정 상한선이며 상한 범위 내에서 공인중개사와 고객이 협의할 수 있습니다.</p>
      )}
    </section>
  );
}
