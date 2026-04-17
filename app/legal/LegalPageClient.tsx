"use client";

import LegalHeader from "@/components/legal/LegalHeader";
import LegalIntroTabs from "@/components/legal/LegalIntroTabs";
import LegalTypeToggle from "@/components/legal/LegalTypeToggle";
import LegalForm from "@/components/legal/LegalForm";
import LegalResultSection from "@/components/legal/LegalResultSection";
import LegalSaveSection from "@/components/legal/LegalSaveSection";
import LegalBasisSection from "@/components/legal/LegalBasisSection";
import LegalNotice from "@/components/legal/LegalNotice";
import LegalFaq from "@/components/legal/LegalFaq";
import LegalArticle from "@/components/legal/LegalArticle";
import DocsArticlePage from "@/components/docs/DocsArticlePage";
import { useLegalCalculator } from "@/hooks/legal/useLegalCalculator";

export default function LegalPageClient() {
  const vm = useLegalCalculator();

  return (
    <main className="legal-page" id="main" role="main" style={{ maxWidth: 1160 }}>
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: "#0f172a", marginBottom: 6 }}>법무사 보수 계산기</h1>
        <p className="legal-meta">과세표준·기재금액 기반으로 법무사 보수, 부가세, 인지·증지 비용을 계산하고 최신 기준표 요약까지 한 화면에서 확인하세요.</p>
      </div>

      <div className="explorer-grid legal-explorer-grid">
        <div style={{ display: "grid", gap: 10, minWidth: 0 }}>
          <LegalHeader />
          <LegalIntroTabs />
          <section id="contents" className="legal-card">
            <LegalTypeToggle realEstateType={vm.realEstateType} onHouse={vm.setHouse} onBuilding={vm.setBuilding} />
            <LegalForm
              amount={vm.amount}
              stampAmount={vm.stampAmount}
              publicCost={vm.publicCost}
              onAmount={vm.setAmount}
              onStampAmount={vm.setStampAmount}
              onPublicCost={vm.setPublicCost}
              onSubmit={() => vm.onCalculate("replace")}
              onAdd={() => vm.onCalculate("add")}
              onResetToInitial={vm.onResetToInitial}
              canAdd={vm.results.length > 0}
              isDirty={vm.isDirty}
              error={vm.error}
            />
          </section>

          <LegalNotice />
          <LegalFaq />
          <LegalArticle />

          <section className="legal-card">
            <DocsArticlePage id="413" embedded />
          </section>
        </div>

        <aside className="legal-result-aside" style={{ minWidth: 0 }}>
          <div className="legal-result-stack">
            {vm.results.length > 0 ? (
              <>
                <LegalResultSection
                  rows={vm.results}
                  showNumber={vm.showNumber}
                  onToggleNumber={vm.toggleNumber}
                  visible={vm.results.length > 0}
                />
                <section className="legal-card">
                  <LegalBasisSection visible={vm.results.length > 0} basis={vm.basisText} />
                </section>
                <section className="legal-card">
                  <LegalSaveSection
                    visible={vm.results.length > 0}
                    busy={vm.busy}
                    feedback={vm.saveFeedback}
                    onClearFeedback={vm.clearSaveFeedback}
                    onShareLink={vm.onShareLink}
                    onSaveImage={vm.onSaveImage}
                    onSavePdf={vm.onSavePdf}
                  />
                </section>
              </>
            ) : (
              <section className="legal-card legal-result-empty">
                <h3 style={{ fontWeight: 800 }}>계산 결과</h3>
                <p className="legal-meta">좌측 입력값을 설정하고 보수 계산 버튼을 눌러주세요.</p>
              </section>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}
