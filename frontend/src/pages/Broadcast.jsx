import { useEffect, useState } from "react";
import { Radio, Zap, Users } from "lucide-react";
import api from "../api/axios";
import Card from "../components/Card";
import Badge from "../components/Badge";
import { Field, Select, SecondaryButton, PrimaryButton } from "../components/Form";
import { Spinner, EmptyState } from "../components/Status";
import { BLOOD_GROUPS, formatDate } from "../utils/constants";

export default function Broadcast() {
  const [history, setHistory] = useState(null);
  const [group, setGroup] = useState("O-");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  function load() {
    api.get("/broadcast/history").then(({ data }) => setHistory(data.broadcasts));
  }
  useEffect(load, []);

  async function manualTrigger() {
    setBusy(true);
    try {
      const { data } = await api.post("/broadcast/trigger", { bloodGroup: group, reason: "manual" });
      setMessage(`Notified ${data.notifiedDonors.length} eligible donor(s) for ${group}.`);
      load();
    } finally {
      setBusy(false);
    }
  }

  async function autoCheck() {
    setBusy(true);
    try {
      const { data } = await api.post("/broadcast/auto-check");
      setMessage(
        data.triggeredCount > 0
          ? `Auto-check triggered ${data.triggeredCount} broadcast(s) for low-stock group(s).`
          : "Auto-check ran — no blood group is currently below the low-stock threshold."
      );
      load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card title="Trigger a Broadcast">
        <p className="mb-4 text-sm text-muted">
          Simulates the Emergency Broadcast System — finds compatible, eligible donors for a blood group and logs
          them as notified. Real SMS/email delivery is listed as future scope.
        </p>
        {message && <p className="mb-4 rounded-lg bg-vital-light px-3 py-2 text-sm text-vital">{message}</p>}
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Blood group">
            <Select value={group} onChange={(e) => setGroup(e.target.value)}>
              {BLOOD_GROUPS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </Select>
          </Field>
          <PrimaryButton onClick={manualTrigger} disabled={busy} className="!bg-pulse hover:!opacity-90">
            <Radio size={16} /> Broadcast for {group}
          </PrimaryButton>
          <SecondaryButton onClick={autoCheck} disabled={busy}>
            <Zap size={16} /> Auto-check all groups
          </SecondaryButton>
        </div>
      </Card>

      <Card title="Broadcast History">
        {!history ? (
          <Spinner />
        ) : history.length === 0 ? (
          <EmptyState label="No broadcasts triggered yet" />
        ) : (
          <div className="space-y-3">
            {history.map((b) => (
              <div key={b._id} className="rounded-xl border border-stone p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className="border-crimson/30 bg-crimson-light text-crimson">{b.bloodGroup}</Badge>
                    <Badge className="border-stone-dark bg-stone text-muted">{b.reason.replace("_", " ")}</Badge>
                  </div>
                  <span className="text-xs text-muted">{formatDate(b.createdAt)}</span>
                </div>
                <p className="mt-2 flex items-center gap-1.5 text-sm text-ink">
                  <Users size={14} className="text-muted" />
                  Notified {b.notifiedDonors.length} eligible donor(s) · stock was {b.stockAtTrigger} unit(s) at trigger
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
