type Props = {
  amount: string;
  stampAmount: string;
  publicCost: boolean;
  error: string;
  canAdd: boolean;
  isDirty: boolean;
  onAmount: (v: string) => void;
  onStampAmount: (v: string) => void;
  onPublicCost: (v: boolean) => void;
  onSubmit: () => void;
  onAdd: () => void;
  onResetToInitial: () => void;
};

export default function LegalForm(props: Props) {
  return (
    <form id="form_commission" className="form-horizontal form-group-lg" onSubmit={(e) => e.preventDefault()}>
      <div className="mb-3 text-nowrap" style={{ overflowX: "auto" }}>
        <div className="custom-control custom-checkbox mb-2 mr-3 d-inline">
          <input
            type="checkbox"
            className="custom-control-input"
            name="publicCost"
            value="Y"
            id="publicCost"
            checked={props.publicCost}
            onChange={(e) => props.onPublicCost(e.target.checked)}
          />
          <label className="custom-control-label" htmlFor="publicCost">
            공공비용(인지·증지) 포함
          </label>
        </div>
      </div>

      <input type="hidden" id="realEstateType" name="realEstateType" value="house" />
      <input type="hidden" id="own" name="own" value="one" />

      <div className="row legal-row">
        <div className="col-md-6 mb-3">
          <div className="input-group">
            <div className="input-group-prepend">
              <span className="input-group-text">
                과세표준&nbsp;
                <i
                  className="small bi bi-question-circle"
                  data-toggle="tooltip"
                  data-placement="top"
                  data-original-title="건물 신축 등이 아닌 경우 일반적으로 시가표준액이 과세표준이 됩니다."
                />
              </span>
            </div>
            <input
              type="number"
              className="form-control number-helper"
              id="amount"
              name="amount"
              placeholder="금액 입력"
              value={props.amount}
              onChange={(e) => props.onAmount(e.target.value)}
            />
            <div className="input-group-append">
              <span className="input-group-text">만원</span>
            </div>
          </div>
        </div>

        <div className="col-md-6 mb-3 publicCostGroup" style={{ display: props.publicCost ? "block" : "none" }}>
          <div className="input-group">
            <div className="input-group-prepend">
              <span className="input-group-text">
                기재금액&nbsp;
                <i
                  className="small bi bi-question-circle"
                  data-toggle="tooltip"
                  data-placement="top"
                  data-original-title="수입인지 등은 계약서에 기재된 금액(매매가 등) 기준으로 계산합니다."
                />
              </span>
            </div>
            <input
              type="number"
              className="form-control number-helper"
              id="stampAmount"
              name="stampAmount"
              placeholder="금액 입력"
              value={props.stampAmount}
              onChange={(e) => props.onStampAmount(e.target.value)}
            />
            <div className="input-group-append">
              <span className="input-group-text">만원</span>
            </div>
          </div>
        </div>

        <div className="col-md-6 nocap legal-action-row">
          <button id="submit" type="button" onClick={props.onSubmit} className="btn btn-primary">
            <i className="bi bi-calculator-fill" /> 보수 계산
          </button>
          <button id="addSubmit" type="button" onClick={props.onAdd} className="btn btn-primary ml-2" style={{ display: props.canAdd ? "inline-block" : "none" }}>
            <i className="bi bi-plus-lg" /> 추가
          </button>
          <button
            id="resetSubmit"
            type="button"
            onClick={props.onResetToInitial}
            className="btn btn-outline-secondary ml-2"
            disabled={!props.isDirty}
            title="초기 입력 상태로 되돌리기"
          >
            원상복귀
          </button>
        </div>
      </div>

      {props.error ? (
        <p className="legal-error" role="alert" aria-live="polite" id="legal-form-error">
          {props.error}
        </p>
      ) : null}
    </form>
  );
}
