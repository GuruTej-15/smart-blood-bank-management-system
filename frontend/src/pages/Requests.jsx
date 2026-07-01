import { useEffect, useState } from "react";
import { Plus, Check, X, PlayCircle } from "lucide-react";
import api from "../api/axios";
import Card from "../components/Card";
import Modal from "../components/Modal";
import Badge from "../components/Badge";
import { Field, TextInput, Select, PrimaryButton, SecondaryButton } from "../components/Form";
import { Spinner, EmptyState } from "../components/Status";
import { BLOOD_GROUPS, STATUS_STYLES, formatDate } from "../utils/constants";
import { useAuth } from "../context/AuthContext";

function CreateRequestForm({ onCreated, onCancel, isHospitalUser }) {
  const [hospitals, setHospitals] = useState([]);
  const [form, setForm] = useState({
    hospital: "",
    patientName: "",
    bloodGroup: "A+",
    unitsRequired: 1,
    priority: "normal",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isHospitalUser) return;
    api.get("/hospitals").then(({ data }) => {
      setHospitals(data.hospitals);
      if (data.hospitals[0]) setForm((f) => ({ ...f, hospital: data.hospitals[0]._id }));
    });
  }, [isHospitalUser]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const { data } = await api.post("/requests", form);
      onCreated(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create request");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="rounded-lg bg-pulse-light px-3 py-2 text-sm text-pulse">{error}</p>}
      {!isHospitalUser && (
        <Field label="Hospital">
          <Select required value={form.hospital} onChange={(e) => setForm({ ...form, hospital: e.target.value })}>
            {hospitals.map((h) => (
              <option key={h._id} value={h._id}>
                {h.hospitalName}
              </option>
            ))}
          </Select>
        </Field>
      )}
      <Field label="Patient name (optional)">
        <TextInput value={form.patientName} onChange={(e) => setForm({ ...form, patientName: e.target.value })} />
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
          <option value="normal">Normal</option>
          <option value="medium">Medium</option>
        </Select>
      </Field>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="text-sm font-medium text-muted hover:text-ink">
          Cancel
        </button>
        <PrimaryButton type="submit" disabled={submitting}>
          {submitting ? "Submitting…" : "Create Request"}
        </PrimaryButton>
      </div>
    </form>
  );
}

export default function Requests() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const isHospital = user?.role === "hospital";
  const [requests, setRequests] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [actionMsg, setActionMsg] = useState("");

  function load() {
    api.get("/requests").then(({ data }) => setRequests(data.requests));
  }

  useEffect(load, []);

  async function processNext() {
    const { data } = await api.post("/requests/process-next");
    setActionMsg(data.request ? `Processed request for ${data.request.bloodGroup}` : data.message);
    load();
  }

  async function approve(id) {
    await api.post(`/requests/${id}/approve`);
    load();
  }
  async function reject(id) {
    await api.post(`/requests/${id}/reject`);
    load();
  }

  const pending = requests?.filter((r) => r.status === "pending" && !r.isEmergency) || [];
  const queueTitle = isAdmin ? "Pending Queue (FCFS)" : "My Pending Requests";
  const emptyPendingLabel = isAdmin ? "Queue is empty" : "No pending requests";
  const allRequestsTitle = isHospital ? "My Requests" : "All Requests";

  return (
    <div className="space-y-6">
      <Card
        title={queueTitle}
        action={
          <div className="flex gap-2">
            {isAdmin && (
              <SecondaryButton onClick={processNext}>
                <PlayCircle size={16} /> Process Next
              </SecondaryButton>
            )}
            <PrimaryButton onClick={() => setCreateOpen(true)}>
              <Plus size={16} /> New Request
            </PrimaryButton>
          </div>
        }
      >
        {actionMsg && <p className="mb-3 rounded-lg bg-vital-light px-3 py-2 text-sm text-vital">{actionMsg}</p>}
        {!requests ? (
          <Spinner />
        ) : pending.length === 0 ? (
          <EmptyState label={emptyPendingLabel} />
        ) : (
          <ol className="space-y-2">
            {pending.map((r, i) => (
              <li key={r._id} className="flex items-center gap-3 rounded-xl border border-stone p-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-stone font-mono text-xs text-muted">
                  {i + 1}
                </span>
                <Badge className="border-crimson/30 bg-crimson-light text-crimson">{r.bloodGroup}</Badge>
                <div className="flex-1">
                  <p className="text-sm font-medium text-ink">
                    {r.unitsRequired} unit(s) · {r.hospital?.hospitalName || "Unknown hospital"}
                  </p>
                  <p className="text-xs text-muted">{r.patientName || "—"}</p>
                </div>
                {isAdmin && (
                  <>
                    <button
                      onClick={() => approve(r._id)}
                      className="rounded-lg bg-vital-light p-2 text-vital hover:opacity-80"
                      title="Approve & fulfill"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      onClick={() => reject(r._id)}
                      className="rounded-lg bg-pulse-light p-2 text-pulse hover:opacity-80"
                      title="Reject"
                    >
                      <X size={16} />
                    </button>
                  </>
                )}
              </li>
            ))}
          </ol>
        )}
      </Card>

      <Card title={allRequestsTitle}>
        {!requests ? (
          <Spinner />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-stone text-xs uppercase tracking-wide text-muted">
                  <th className="py-2 pr-4">Hospital</th>
                  <th className="py-2 pr-4">Blood Group</th>
                  <th className="py-2 pr-4">Units</th>
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Created</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r._id} className="border-b border-stone/60 hover:bg-paper">
                    <td className="py-2.5 pr-4 text-ink">{r.hospital?.hospitalName || "—"}</td>
                    <td className="py-2.5 pr-4">
                      <Badge className="border-crimson/30 bg-crimson-light text-crimson">{r.bloodGroup}</Badge>
                    </td>
                    <td className="py-2.5 pr-4 text-ink">{r.unitsRequired}</td>
                    <td className="py-2.5 pr-4 text-muted">{r.isEmergency ? "Emergency" : "Normal"}</td>
                    <td className="py-2.5 pr-4">
                      <Badge className={STATUS_STYLES[r.status]}>{r.status}</Badge>
                    </td>
                    <td className="py-2.5 pr-4 text-muted">{formatDate(r.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Blood Request">
        <CreateRequestForm
          isHospitalUser={isHospital}
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
