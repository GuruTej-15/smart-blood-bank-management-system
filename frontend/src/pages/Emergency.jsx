import { useEffect, useState } from "react";
import { Plus, PlayCircle, Siren } from "lucide-react";
import api from "../api/axios";
import Card from "../components/Card";
import Modal from "../components/Modal";
import Badge from "../components/Badge";
import EmergencyRequestForm from "../components/EmergencyRequestForm";
import { SecondaryButton, PrimaryButton } from "../components/Form";
import { Spinner, EmptyState } from "../components/Status";
import { PRIORITY_STYLES } from "../utils/constants";

export default function Emergency() {
  const [queue, setQueue] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [result, setResult] = useState(null);

  function load() {
    api.get("/emergency/queue").then(({ data }) => setQueue(data.queue));
  }

  useEffect(load, []);

  async function processNext() {
    const { data } = await api.post("/emergency/process-next");
    setResult(data);
    load();
  }

  return (
    <div className="space-y-6">
      <Card
        title="Emergency Priority Queue"
        action={
          <div className="flex gap-2">
            <SecondaryButton onClick={processNext}>
              <PlayCircle size={16} /> Process Most Urgent
            </SecondaryButton>
          </div>
        }
      >
        {result && (
          <div
            className={`mb-4 rounded-lg px-3 py-2 text-sm ${
              result.broadcastTriggered ? "bg-amber-light text-amber" : "bg-vital-light text-vital"
            }`}
          >
            {result.request
              ? `Processed ${result.request.bloodGroup} request — fulfilled ${result.fulfilledUnits}, shortfall ${result.shortfall}.`
              : result.message}
            {result.broadcastTriggered && " Stock fell short — Emergency Broadcast triggered to eligible donors."}
          </div>
        )}

        {!queue ? (
          <Spinner />
        ) : queue.length === 0 ? (
          <EmptyState label="No pending emergency requests" />
        ) : (
          <ol className="space-y-2">
            {queue.map((r, i) => (
              <li
                key={r._id}
                className={`flex items-center gap-3 rounded-xl border p-3 ${
                  i === 0 ? "border-pulse/40 bg-pulse-light/40" : "border-stone"
                }`}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-stone font-mono text-xs text-muted">
                  {i + 1}
                </span>
                {i === 0 && <Siren size={16} className="shrink-0 animate-breathe text-pulse" />}
                <Badge className="border-crimson/30 bg-crimson-light text-crimson">{r.bloodGroup}</Badge>
                <Badge className={PRIORITY_STYLES[r.priority]}>{r.priority}</Badge>
                <div className="flex-1">
                  <p className="text-sm font-medium text-ink">
                    {r.unitsRequired} unit(s) · {r.patientName || "Unnamed patient"}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </Card>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Submit Emergency Request">
        <EmergencyRequestForm
          onCreated={() => {
            setCreateOpen(false);
            load();
          }}
          onCancel={() => setCreateOpen(false)}
        />
      </Modal>
    </div>
  );
}
