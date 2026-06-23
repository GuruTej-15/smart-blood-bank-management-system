import { useEffect, useState } from "react";
import { Plus, AlertTriangle } from "lucide-react";
import api from "../api/axios";
import Card from "../components/Card";
import Modal from "../components/Modal";
import Badge from "../components/Badge";
import { Field, TextInput, Select, PrimaryButton } from "../components/Form";
import { Spinner, EmptyState } from "../components/Status";
import { BLOOD_GROUPS, formatDate } from "../utils/constants";

const STATUS_BADGE = {
  available: "border-vital/30 bg-vital-light text-vital",
  reserved: "border-amber/30 bg-amber-light text-amber",
  used: "border-stone-dark bg-stone text-muted",
  expired: "border-pulse/30 bg-pulse-light text-pulse",
};

function AddBatchForm({ onCreated, onCancel }) {
  const [form, setForm] = useState(() => {
    const todayPlus42 = new Date(Date.now() + 42 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    return {
      bloodGroup: "O+",
      units: 1,
      collectedDate: new Date().toISOString().slice(0, 10),
      expiryDate: todayPlus42,
      source: "manual-entry",
    };
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const { data } = await api.post("/inventory", form);
      onCreated(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add batch");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="rounded-lg bg-pulse-light px-3 py-2 text-sm text-pulse">{error}</p>}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Blood group">
          <Select value={form.bloodGroup} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}>
            {BLOOD_GROUPS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Units">
          <TextInput
            type="number"
            min={1}
            value={form.units}
            onChange={(e) => setForm({ ...form, units: Number(e.target.value) })}
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Collected date">
          <TextInput
            type="date"
            value={form.collectedDate}
            onChange={(e) => setForm({ ...form, collectedDate: e.target.value })}
          />
        </Field>
        <Field label="Expiry date">
          <TextInput
            type="date"
            value={form.expiryDate}
            onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
          />
        </Field>
      </div>
      <Field label="Source / notes">
        <TextInput value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} />
      </Field>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="text-sm font-medium text-muted hover:text-ink">
          Cancel
        </button>
        <PrimaryButton type="submit" disabled={submitting}>
          {submitting ? "Saving…" : "Add Batch"}
        </PrimaryButton>
      </div>
    </form>
  );
}

export default function Inventory() {
  const [batches, setBatches] = useState(null);
  const [expiring, setExpiring] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [filter, setFilter] = useState("");

  function load() {
    api.get("/inventory", { params: filter ? { bloodGroup: filter } : {} }).then(({ data }) => setBatches(data.batches));
    api.get("/inventory/expiring", { params: { days: 7 } }).then(({ data }) => setExpiring(data.units));
  }

  useEffect(load, [filter]);

  return (
    <div className="space-y-6">
      {expiring && expiring.length > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber/30 bg-amber-light p-4">
          <AlertTriangle className="mt-0.5 shrink-0 text-amber" size={20} />
          <div>
            <p className="font-medium text-amber">{expiring.length} unit(s) expiring within 7 days</p>
            <p className="mt-1 text-sm text-amber/90">
              {expiring
                .slice(0, 5)
                .map((u) => `${u.bloodGroup} (${formatDate(u.expiryDate)})`)
                .join(" · ")}
              {expiring.length > 5 ? ` +${expiring.length - 5} more` : ""}
            </p>
          </div>
        </div>
      )}

      <Card
        title="Inventory Batches"
        action={
          <PrimaryButton onClick={() => setAddOpen(true)}>
            <Plus size={16} /> Add Batch
          </PrimaryButton>
        }
      >
        <div className="mb-4 flex items-center gap-3">
          <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="max-w-[160px]">
            <option value="">All blood groups</option>
            {BLOOD_GROUPS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </Select>
        </div>

        {!batches ? (
          <Spinner />
        ) : batches.length === 0 ? (
          <EmptyState label="No inventory batches found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-stone text-xs uppercase tracking-wide text-muted">
                  <th className="py-2 pr-4">Blood Group</th>
                  <th className="py-2 pr-4">Units</th>
                  <th className="py-2 pr-4">Collected</th>
                  <th className="py-2 pr-4">Expires</th>
                  <th className="py-2 pr-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((b) => (
                  <tr key={b._id} className="border-b border-stone/60 hover:bg-paper">
                    <td className="py-2.5 pr-4">
                      <Badge className="border-crimson/30 bg-crimson-light text-crimson">{b.bloodGroup}</Badge>
                    </td>
                    <td className="py-2.5 pr-4 text-ink">{b.units}</td>
                    <td className="py-2.5 pr-4 text-muted">{formatDate(b.collectedDate)}</td>
                    <td className="py-2.5 pr-4 text-muted">{formatDate(b.expiryDate)}</td>
                    <td className="py-2.5 pr-4">
                      <Badge className={STATUS_BADGE[b.status]}>{b.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Inventory Batch">
        <AddBatchForm
          onCreated={() => {
            setAddOpen(false);
            load();
          }}
          onCancel={() => setAddOpen(false)}
        />
      </Modal>
    </div>
  );
}
