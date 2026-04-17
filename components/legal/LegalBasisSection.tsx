type Props = {
  visible: boolean;
  basis: string;
};

export default function LegalBasisSection({ visible, basis }: Props) {
  return (
    <div className="hiding" style={{ display: visible ? "block" : "none" }}>
      <div className="alert alert-success ask d-none nocap" role="alert" />
      <div id="basisWrap" className="p-3 my-3 alert-info rounded" style={{ display: visible ? "block" : "none" }}>
        <h5>계산결과 해설</h5>
        <div id="basis" style={{ whiteSpace: "pre-line", lineHeight: 1.65 }}>
          {basis}
        </div>
      </div>
    </div>
  );
}
