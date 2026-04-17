"use client";

import Link from "next/link";

type Props = { id: string; embedded?: boolean };

export default function DocsArticlePage({ id, embedded = false }: Props) {
  const articleId = Number(id || "413");
  const wrapClassName = embedded ? "docs-article-wrap" : "container docs-article-wrap";

  const articleBody = (
    <div className={wrapClassName} role="region" aria-label="부동산 정책 자료실" id="policy-section">
      <h5 className="mt-4 pl-2 mb-3">
        📢 <Link className="title" href="/docs"><b>부동산 정책 자료실</b></Link>
      </h5>

      <div className="p-3 mb-3 bg-light rounded shadow-s nocap">
        계산 결과를 해석할 때 필요한 기준표·개정 공지·첨부파일 정보를 한곳에서 확인할 수 있도록 정리한 정책 자료 섹션입니다.
      </div>

      <div className="p-3 subject-wrapper">
        <h4 id="subject" style={{ fontWeight: "bold" }}>법무사 보수기준 개정 요약 (2024-09-12 기준)</h4>
      </div>

      <div id="attachedImgs" className="pswp-gallery" data-pswp="" />

      <div id="content" className="px-2 py-3">
        <p>2024년 9월 12일 고시 기준으로 법무사 보수 체계가 일부 조정되었습니다. 아래는 등기 실무에서 체감도가 높은 변경 포인트입니다.</p>
        <p>
          - 부동산 등기 관련 보수 구간이 전반적으로 상향 조정되었습니다.<br />
          - 신고 대행·세금 납부 대행 단가가 기존 대비 인상되었습니다.<br />
          - 일당 및 현지 교통비 기준도 현실 단가에 맞춰 상향되었습니다.
        </p>
        <p>
          실무 영향은 크게 두 가지입니다. 첫째, 동일 금액 거래에서도 이전 기준 대비 보수 합계가 올라갈 수 있습니다. 둘째, 부대 업무(신고·납부 대행 등)를 함께
          맡기는 경우 체감 비용 차이가 더 커질 수 있습니다. 따라서 계산기 결과를 확인한 뒤, 실제 의뢰 범위를 반영한 견적서를 별도로 확인하는 절차가 중요합니다.
        </p>
        <p>
          본 페이지의 계산 결과는 빠른 의사결정을 위한 사전 검토용이며, 최종 비용 확정 문서는 아닙니다. 접수 직전에는 최신 고시 원문·첨부파일·법무사 사무소 견적을
          함께 비교해 주세요.
        </p>
        <p>
          관련 계산은 이 페이지 상단 계산기를 바로 이용할 수 있으며, 중개보수 비교가 필요하면 <Link href="/commission">중개보수 계산기</Link>도 함께 확인해 보세요.
        </p>
      </div>

      <input type="hidden" id="parent" name="parent" value={articleId} />
    </div>
  );

  if (embedded) return articleBody;

  return (
    <main id="main" role="main">
      {articleBody}
    </main>
  );
}
