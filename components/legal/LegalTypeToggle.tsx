import type { RealEstateType } from "@/lib/legal/types";

type Props = {
  realEstateType: RealEstateType;
  onHouse: () => void;
  onBuilding: () => void;
};

export default function LegalTypeToggle({ realEstateType, onHouse, onBuilding }: Props) {
  return (
    <div className="btn-group mb-3 mr-3 shadow-xs realEstateType" role="group" aria-label="물건 종류">
      <button type="button" className={`btn btn-light house ${realEstateType === "house" ? "active" : ""}`} onClick={onHouse}>
        주택
      </button>
      <button type="button" className={`btn btn-light building ${realEstateType === "building" ? "active" : ""}`} onClick={onBuilding}>
        그 외 건물
      </button>
    </div>
  );
}
