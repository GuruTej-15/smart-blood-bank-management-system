import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import api from "../api/axios";
import Card from "../components/Card";
import Modal from "../components/Modal";
import { Field, TextInput, PrimaryButton } from "../components/Form";
import { Spinner, EmptyState } from "../components/Status";

function AddHospitalForm({ onCreated, onCancel }) {
  const [form, setForm] = useState({ hospitalName: "", contactNumber: "", email: "", address: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const { data } = await api.post("/hospitals", form);
      onCreated(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add hospital");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="rounded-lg bg-pulse-light px-3 py-2 text-sm text-pulse">{error}</p>}
      <Field label="Hospital name">
        <TextInput required value={form.hospitalName} onChange={(e) => setForm({ ...form, hospitalName: e.target.value })} />
      </Field>
      <Field label="Contact number">
        <TextInput required value={form.contactNumber} onChange={(e) => setForm({ ...form, contactNumber: e.target.value })} />
      </Field>
      <Field label="Email (optional)">
        <TextInput type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      </Field>
      <Field label="Address">
        <TextInput value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
      </Field>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="text-sm font-medium text-muted hover:text-ink">
          Cancel
        </button>
        <PrimaryButton type="submit" disabled={submitting}>
          {submitting ? "Saving…" : "Add Hospital"}
        </PrimaryButton>
      </div>
    </form>
  );
}

export default function Hospitals() {
  const [hospitals, setHospitals] = useState(null);
  const [addOpen, setAddOpen] = useState(false);

  function load() {
    api.get("/hospitals").then(({ data }) => setHospitals(data.hospitals));
  }
  useEffect(load, []);

  return (
    <div className="space-y-6">
      <Card
        title="Partner Hospitals"
        action={
          <PrimaryButton onClick={() => setAddOpen(true)}>
            <Plus size={16} /> Add Hospital
          </PrimaryButton>
        }
      >
        {!hospitals ? (
          <Spinner />
        ) : hospitals.length === 0 ? (
          <EmptyState label="No hospitals yet" />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {hospitals.map((h) => (
              <div key={h._id} className="rounded-xl border border-stone p-4">
                <p className="font-display text-base font-semibold text-ink">{h.hospitalName}</p>
                <p className="mt-1 text-sm text-muted">{h.address || "No address on file"}</p>
                <p className="mt-2 font-mono text-xs text-muted">{h.contactNumber}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Hospital">
        <AddHospitalForm
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
