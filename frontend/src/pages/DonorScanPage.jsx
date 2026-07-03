import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axios";
import { Spinner } from "../components/Status";
import Badge from "../components/Badge";
import { REWARD_STYLES, formatDate } from "../utils/constants";

export default function DonorScanPage() {
  const { donorId } = useParams();
  const [donor, setDonor] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!donorId) return;
    api
      .get(`/donors/${donorId}`)
      .then(({ data }) => setDonor(data))
      .catch(() => setError("Unable to load donor information"));
  }, [donorId]);

  if (!donor) {
    return <div className="p-6">{error ? <p className="text-crimson">{error}</p> : <Spinner label="Loading donor details…" />}</div>;
  }

  const rewardLevel = donor.totalDonations >= 10 ? "Gold" : donor.totalDonations >= 5 ? "Silver" : "Bronze";

  return (
    <div className="min-h-screen bg-paper p-6 text-ink">
      <div className="mx-auto max-w-xl rounded-2xl border border-stone bg-white p-6 shadow-sm">
        <h1 className="font-display text-2xl font-semibold">Donor Card</h1>
        <p className="mt-2 text-sm text-muted">Scanned successfully from a QR code.</p>

        <div className="mt-5 rounded-xl border border-stone bg-paper p-4">
          <p className="font-display text-xl font-semibold">{donor.name}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge className="border-crimson/30 bg-crimson-light text-crimson">{donor.bloodGroup}</Badge>
            <Badge className={REWARD_STYLES[rewardLevel] || REWARD_STYLES.Bronze}>{rewardLevel} Donor</Badge>
          </div>
          <div className="mt-4 grid gap-3 text-sm text-muted">
            <div><span className="font-medium text-ink">Phone:</span> {donor.phone}</div>
            <div><span className="font-medium text-ink">Email:</span> {donor.email || "—"}</div>
            <div><span className="font-medium text-ink">Address:</span> {donor.address || "—"}</div>
            <div><span className="font-medium text-ink">Last donation:</span> {formatDate(donor.lastDonationDate)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
