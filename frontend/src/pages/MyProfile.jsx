import { useEffect, useState } from "react";
import { Droplets, BadgeCheck, QrCode } from "lucide-react";
import api from "../api/axios";
import Card from "../components/Card";
import Badge from "../components/Badge";
import { Spinner } from "../components/Status";
import { REWARD_STYLES, formatDate } from "../utils/constants";

export default function MyProfile() {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/donors/me")
      .then(({ data }) => setProfile(data))
      .catch((err) => setError(err.response?.data?.message || "Failed to load donor profile"));
  }, []);

  if (error) {
    return <p className="rounded-lg bg-pulse-light px-3 py-2 text-sm text-pulse">{error}</p>;
  }

  if (!profile) {
    return <Spinner label="Loading donor profile…" />;
  }

  const { donor, eligibility, rewardLevel, nextLevel, qrCodeDataUrl } = profile;

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <Card title="My Donor Profile">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <img
            src={qrCodeDataUrl}
            alt="Donor QR code"
            className="h-28 w-28 rounded-2xl border border-stone bg-white p-2"
          />
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-display text-2xl font-semibold text-ink">{donor.name}</p>
              <Badge className="border-crimson/30 bg-crimson-light text-crimson">{donor.bloodGroup}</Badge>
              <Badge className={REWARD_STYLES[rewardLevel]}>{rewardLevel} Donor</Badge>
            </div>
            <p className="text-sm text-muted">{donor.email || "No email on file"}</p>
            <p className="text-sm text-muted">{donor.phone}</p>
            <p className="text-sm text-muted">{donor.address || "No address on file"}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-stone p-4">
            <p className="text-xs uppercase tracking-wide text-muted">Donation status</p>
            <div className="mt-2 flex items-center gap-2 text-ink">
              <BadgeCheck size={18} className="text-vital" />
              <span className="font-medium">{eligibility.eligible ? "Eligible to donate" : "Not yet eligible"}</span>
            </div>
            <p className="mt-2 text-sm text-muted">
              {eligibility.daysSinceLastDonation === null
                ? "No previous donations recorded"
                : `${eligibility.daysSinceLastDonation} day(s) since last donation`}
            </p>
            <p className="text-sm text-muted">Last donation: {formatDate(donor.lastDonationDate)}</p>
          </div>

          <div className="rounded-xl border border-stone p-4">
            <p className="text-xs uppercase tracking-wide text-muted">Recognition</p>
            <div className="mt-2 flex items-center gap-2 text-ink">
              <Droplets size={18} className="text-crimson" />
              <span className="font-medium">{donor.totalDonations || 0} total donation(s)</span>
            </div>
            <p className="mt-2 text-sm text-muted">
              {nextLevel
                ? `${nextLevel.donationsNeeded} more donation(s) to reach ${nextLevel.name}`
                : "You are at the top reward tier."}
            </p>
          </div>
        </div>
      </Card>

      <Card title="Digital Donor Card">
        <div className="space-y-3 text-sm text-muted">
          <div className="flex items-center gap-2 text-ink">
            <QrCode size={18} className="text-vital" />
            <span className="font-medium">QR code for verification</span>
          </div>
          <p>
            Keep this card handy for donor identification, quick eligibility checks, and reward lookups.
          </p>
          <div className="rounded-xl border border-stone bg-paper p-4 font-mono text-xs text-ink">
            <p>ID: {donor._id}</p>
            <p className="mt-1">Blood Group: {donor.bloodGroup}</p>
            <p className="mt-1">Status: {eligibility.eligible ? "Eligible" : "Waiting period active"}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
