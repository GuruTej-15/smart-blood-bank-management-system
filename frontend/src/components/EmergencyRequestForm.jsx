import { useEffect, useState } from "react";
import api from "../api/axios";
import { BLOOD_GROUPS } from "../utils/constants";
import { Field, TextInput, Select, PrimaryButton } from "./Form";

export default function EmergencyRequestForm({ onCreated, onCancel }) {
  const [hospitals, setHospitals] = useState([]);
  const [form, setForm] = useState({
    hospital: "",
    patientName: "",
    bloodGroup: "O-",
    unitsRequired: 2,
    priority: "critical",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/hospitals").then(({ data }) => {
      setHospitals(data.hospitals);
      if (data.hospitals[0]) setForm((f) => ({ ...f, hospital: data.hospitals[0]._id }));
    });
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const { data } = await api.post("/emergency", form);
      onCreated?.(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create emergency request");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="rounded-lg bg-pulse-light px-3 py-2 text-sm text-pulse">{error}</p>}
      <Field label="Hospital">
        <Select
          required
          value={form.hospital}
          onChange={(e) => setForm({ ...form, hospital: e.target.value })}
        >
          {hospitals.map((h) => (
            <option key={h._id} value={h._id}>
              {h.hospitalName}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Patient name (optional)">
        <TextInput
          value={form.patientName}
          onChange={(e) => setForm({ ...form, patientName: e.target.value })}
          placeholder="e.g. Ramesh Kumar"
        />
      </Field>
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
        <Field label="Units required">
          <TextInput
            type="number"
            min={1}
            value={form.unitsRequired}
            onChange={(e) => setForm({ ...form, unitsRequired: Number(e.target.value) })}
          />
        </Field>
      </div>
      <Field label="Priority">
        <Select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
          <option value="critical">Critical</option>
          <option value="high">High</option>
        </Select>
      </Field>
      <Field label="Notes (optional)">
        <TextInput value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      </Field>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="text-sm font-medium text-muted hover:text-ink">
          Cancel
        </button>
        <PrimaryButton type="submit" disabled={submitting} className="!bg-pulse hover:!opacity-90">
          {submitting ? "Submitting…" : "Submit Emergency Request"}
        </PrimaryButton>
      </div>
    </form>
  );
}
