import { useEffect, useState } from "react";
import { Plus, HeartHandshake } from "lucide-react";
import api from "../api/axios";
import Card from "../components/Card";
import Modal from "../components/Modal";
import Badge from "../components/Badge";
import { Field, Select, TextInput, PrimaryButton } from "../components/Form";
import { Spinner, EmptyState } from "../components/Status";
import { formatDate } from "../utils/constants";

function RecordDonationForm({ onCreated, onCancel }) {
  const [donors, setDonors] = useState([]);
  const [form, setForm] = useState({ donorId: "", unitsDonated: 1, date: new Date().toISOString().slice(0, 10) });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get("/donors").then(({ data }) => {
      setDonors(data.donors);
      if (data.donors[0]) setForm((f) => ({ ...f, donorId: data.donors[0]._id }));
    });
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const { data } = await api.post("/donations", form);
      onCreated(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to record donation");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="rounded-lg bg-pulse-light px-3 py-2 text-sm text-pulse">{error}</p>}
      <Field label="Donor">
        <Select required value={form.donorId} onChange={(e) => setForm({ ...form, donorId: e.target.value })}>
          {donors.map((d) => (
            <option key={d._id} value={d._id}>
              {d.name} · {d.bloodGroup}
            </option>
          ))}
        </Select>
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Units donated">
          <TextInput
            type="number"
            min={1}
            value={form.unitsDonated}
            onChange={(e) => setForm({ ...form, unitsDonated: Number(e.target.value) })}
          />
        </Field>
        <Field label="Date">
          <TextInput type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        </Field>
      </div>
      <p className="text-xs text-muted">
        If the donor isn't yet eligible (90-day rule), this will be blocked unless overridden by an admin.
      </p>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="text-sm font-medium text-muted hover:text-ink">
          Cancel
        </button>
        <PrimaryButton type="submit" disabled={submitting}>
          {submitting ? "Recording…" : "Record Donation"}
        </PrimaryButton>
      </div>
    </form>
  );
}

export default function Donations() {
  const [donations, setDonations] = useState(null);
  const [addOpen, setAddOpen] = useState(false);

  function load() {
    api.get("/donations").then(({ data }) => setDonations(data.donations));
  }
  useEffect(load, []);

  return (
    <div className="space-y-6">
      <Card
        title="Donation History"
        action={
          <PrimaryButton onClick={() => setAddOpen(true)}>
            <Plus size={16} /> Record Donation
          </PrimaryButton>
        }
      >
        {!donations ? (
          <Spinner />
        ) : donations.length === 0 ? (
          <EmptyState label="No donations recorded yet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-stone text-xs uppercase tracking-wide text-muted">
                  <th className="py-2 pr-4">Donor</th>
                  <th className="py-2 pr-4">Blood Group</th>
                  <th className="py-2 pr-4">Units</th>
                  <th className="py-2 pr-4">Date</th>
                </tr>
              </thead>
              <tbody>
                {donations.map((d) => (
                  <tr key={d._id} className="border-b border-stone/60 hover:bg-paper">
                    <td className="flex items-center gap-2 py-2.5 pr-4 text-ink">
                      <HeartHandshake size={14} className="text-crimson" />
                      {d.donor?.name || "—"}
                    </td>
                    <td className="py-2.5 pr-4">
                      <Badge className="border-crimson/30 bg-crimson-light text-crimson">{d.bloodGroup}</Badge>
                    </td>
                    <td className="py-2.5 pr-4 text-ink">{d.unitsDonated}</td>
                    <td className="py-2.5 pr-4 text-muted">{formatDate(d.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Record Donation">
        <RecordDonationForm
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
