import { useEffect, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import api from "../api/axios";
import { Spinner } from "./Status";
import Badge from "./Badge";
import { REWARD_STYLES, formatDate } from "../utils/constants";

export default function DonorDetailModal({ donorId }) {
  const [card, setCard] = useState(null);
  const [eligibility, setEligibility] = useState(null);

  useEffect(() => {
    if (!donorId) return;
    api.get(`/donors/${donorId}/card`).then(({ data }) => setCard(data));
    api.get(`/donors/${donorId}/eligibility`).then(({ data }) => setEligibility(data));
  }, [donorId]);

  if (!card) return <Spinner />;
  const { donor, rewardLevel, qrCodeDataUrl } = card;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4 rounded-xl border border-stone bg-paper p-4">
        <img src={qrCodeDataUrl} alt="Donor QR code" className="h-24 w-24 rounded-lg border border-stone bg-white p-1" />
        <div className="min-w-0">
          <p className="font-display text-lg font-semibold text-ink">{donor.name}</p>
          <p className="font-mono text-xs text-muted">ID: {donor._id}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge className="border-crimson/30 bg-crimson-light text-crimson">{donor.bloodGroup}</Badge>
            <Badge className={REWARD_STYLES[rewardLevel]}>{rewardLevel} Donor</Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted">Phone</p>
          <p className="font-medium text-ink">{donor.phone}</p>
        </div>
        <div>
          <p className="text-muted">Total donations</p>
          <p className="font-medium text-ink">{donor.totalDonations}</p>
        </div>
        <div>
          <p className="text-muted">Last donation</p>
          <p className="font-medium text-ink">{formatDate(donor.lastDonationDate)}</p>
        </div>
        <div>
          <p className="text-muted">Address</p>
          <p className="font-medium text-ink">{donor.address || "—"}</p>
        </div>
      </div>

      {eligibility && (
        <div
          className={`flex items-center gap-3 rounded-xl border p-4 ${
            eligibility.eligible ? "border-vital/30 bg-vital-light" : "border-amber/30 bg-amber-light"
          }`}
        >
          {eligibility.eligible ? (
            <CheckCircle2 className="text-vital" size={22} />
          ) : (
            <XCircle className="text-amber" size={22} />
          )}
          <div>
            <p className={`font-medium ${eligibility.eligible ? "text-vital" : "text-amber"}`}>
              {eligibility.eligible ? "Eligible to donate now" : "Not yet eligible"}
            </p>
            {!eligibility.eligible && (
              <p className="text-sm text-muted">Eligible again on {formatDate(eligibility.nextEligibleDate)}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
