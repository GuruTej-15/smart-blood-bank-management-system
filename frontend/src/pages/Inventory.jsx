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
  const [summary, setSummary] = useState({ totalBatches: 0, totalAvailable: 0 });
  const [addOpen, setAddOpen] = useState(false);
  const [groupFilter, setGroupFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  function groupBatches(batchList) {
    const grouped = new Map();
    batchList.forEach((batch) => {
      const key = `${batch.bloodGroup}|${batch.collectedDate}|${batch.expiryDate}|${batch.status}`;
      if (!grouped.has(key)) {
        grouped.set(key, {
          ...batch,
          units: batch.units || 0,
        });
      } else {
        const existing = grouped.get(key);
        existing.units += batch.units || 0;
      }
    });
    return Array.from(grouped.values());
  }

  function load() {
    const params = {};
    if (groupFilter) params.bloodGroup = groupFilter;
    if (statusFilter) params.status = statusFilter;

    api.get("/inventory", { params }).then(({ data }) => {
      setBatches(groupBatches(data.batches));
      const totalAvailable = data.batches
        .filter((batch) => batch.status === "available")
        .reduce((sum, batch) => sum + (batch.units || 0), 0);
      setSummary({ totalBatches: data.batches.length, totalAvailable });
    });
    api.get("/inventory/expiring", { params: { days: 7 } }).then(({ data }) => setExpiring(data.units));
  }

  useEffect(load, [groupFilter, statusFilter]);

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
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-stone/70 bg-stone-light px-3 py-2 text-sm text-ink">
                <p className="font-medium">Total batches</p>
                <p>{summary.totalBatches}</p>
              </div>
              <div className="rounded-2xl border border-stone/70 bg-stone-light px-3 py-2 text-sm text-ink">
                <p className="font-medium">Available units</p>
                <p>{summary.totalAvailable}</p>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-stone/70 bg-white px-3 py-2 text-sm text-muted shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-ink">Blood group</span>
                  <Select value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)} className="max-w-[140px]">
                    <option value="">All groups</option>
                    {BLOOD_GROUPS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-ink">Status</span>
                  <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="max-w-[140px]">
                    <option value="">All statuses</option>
                    <option value="available">Available</option>
                    <option value="used">Used</option>
                    <option value="expired">Expired</option>
                  </Select>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setGroupFilter("");
                    setStatusFilter("");
                  }}
                  className="rounded-lg border border-stone-dark bg-white px-3 py-2 text-sm font-semibold text-ink transition-colors hover:bg-paper"
                >
                  Reset
                </button>
              </div>
              <PrimaryButton onClick={() => setAddOpen(true)}>
                <Plus size={16} /> Add Batch
              </PrimaryButton>
            </div>
          </div>
        }
      >

        {!batches ? (
          <Spinner />
        ) : batches.length === 0 ? (
          <EmptyState label="No inventory batches found" />
        ) : (
          <div className="overflow-x-auto rounded-3xl border border-stone/10 bg-snow shadow-inner">
            <table className="min-w-[700px] w-full text-left text-sm">
              <thead>
                <tr className="bg-paper text-xs uppercase tracking-wide text-muted">
                  <th className="py-3 pr-4 font-semibold">Blood Group</th>
                  <th className="py-3 pr-4 font-semibold">Units</th>
                  <th className="py-3 pr-4 font-semibold">Collected</th>
                  <th className="py-3 pr-4 font-semibold">Expires</th>
                  <th className="py-3 pr-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((b) => (
                  <tr key={b._id} className="border-b border-stone/10 hover:bg-white">
                    <td className="py-3 pr-4">
                      <Badge className="border-crimson/30 bg-crimson-light text-crimson">{b.bloodGroup}</Badge>
                    </td>
                    <td className="py-3 pr-4 text-ink">{b.units}</td>
                    <td className="py-3 pr-4 text-muted">{formatDate(b.collectedDate)}</td>
                    <td className="py-3 pr-4 text-muted">{formatDate(b.expiryDate)}</td>
                    <td className="py-3 pr-4">
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
