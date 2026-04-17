type Props = {
  visible: boolean;
  busy: "" | "image" | "pdf";
  feedback: { tone: "success" | "error" | "info"; message: string; help?: string } | null;
  onClearFeedback: () => void;
  onShareLink: () => void;
  onSaveImage: () => void;
  onSavePdf: () => void;
};

export default function LegalSaveSection({
  visible,
  busy,
  feedback,
  onClearFeedback,
  onShareLink,
  onSaveImage,
  onSavePdf,
}: Props) {
  if (!visible) return null;

  return (
    <section className="legal-save-wrap" aria-labelledby="legal-save-title">
      <div className="legal-save-header">
        <h5 id="legal-save-title" className="font-weight-bold">결과 저장 · 공유</h5>
        <p className="legal-meta">법무사 보수 계산 결과를 링크, 이미지, PDF 형태로 보관할 수 있습니다.</p>
      </div>

      <div className="legal-save-grid">
        <button
          type="button"
          id="btn_media_link"
          className="legal-save-btn"
          aria-label="법무사 보수 계산 결과 링크 복사"
          onClick={onShareLink}
        >
          <i className="bi bi-share" aria-hidden="true" />
          <strong>URL 링크</strong>
          <span>공유 가능한 계산 결과 주소를 복사합니다.</span>
        </button>

        <button
          type="button"
          id="btn_media_image"
          className="legal-save-btn capture-media"
          aria-label="법무사 보수 계산 결과 이미지 저장"
          onClick={onSaveImage}
          disabled={busy === "image"}
        >
          <span className="spinner-grow" style={{ display: busy === "image" ? "inline-block" : "none" }} />
          <i className="bi bi-file-image" aria-hidden="true" />
          <strong>사진 저장</strong>
          <span>메신저/문서 첨부용 이미지로 저장합니다.</span>
        </button>

        <button
          type="button"
          id="btn_media_pdf"
          className="legal-save-btn capture-media"
          aria-label="법무사 보수 계산 결과 PDF 저장"
          onClick={onSavePdf}
          disabled={busy === "pdf"}
        >
          <span className="spinner-grow" style={{ display: busy === "pdf" ? "inline-block" : "none" }} />
          <i className="bi bi-file-pdf" aria-hidden="true" />
          <strong>PDF 저장</strong>
          <span>출력 및 보관용 PDF 파일로 저장합니다.</span>
        </button>
      </div>

      {feedback ? (
        <div className={`legal-save-feedback ${feedback.tone}`} role="status" aria-live="polite">
          <div>
            <strong>{feedback.message}</strong>
            {feedback.help ? <p>{feedback.help}</p> : null}
          </div>
          <button type="button" className="legal-save-feedback-close" onClick={onClearFeedback} aria-label="저장 안내 닫기">
            ×
          </button>
        </div>
      ) : null}
    </section>
  );
}
