import { useEffect, useState } from "react";
import { Plus, Search, Sparkles, IdCard } from "lucide-react";
import api from "../api/axios";
import Card from "../components/Card";
import Modal from "../components/Modal";
import DonorDetailModal from "../components/DonorDetailModal";
import { Field, TextInput, Select, PrimaryButton, SecondaryButton } from "../components/Form";
import { Spinner, EmptyState } from "../components/Status";
import Badge from "../components/Badge";
import { BLOOD_GROUPS, formatDate } from "../utils/constants";

function AddDonorForm({ onCreated, onCancel }) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    bloodGroup: "O+",
    age: 25,
    address: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const { data } = await api.post("/donors", form);
      onCreated(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add donor");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="rounded-lg bg-pulse-light px-3 py-2 text-sm text-pulse">{error}</p>}
      <Field label="Full name">
        <TextInput required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Phone">
          <TextInput required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </Field>
        <Field label="Blood group">
          <Select value={form.bloodGroup} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}>
            {BLOOD_GROUPS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Email (optional)">
          <TextInput type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </Field>
        <Field label="Age">
          <TextInput
            type="number"
            min={18}
            max={65}
            value={form.age}
            onChange={(e) => setForm({ ...form, age: Number(e.target.value) })}
          />
        </Field>
      </div>
      <Field label="Address (optional)">
        <TextInput value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
      </Field>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="text-sm font-medium text-muted hover:text-ink">
          Cancel
        </button>
        <PrimaryButton type="submit" disabled={submitting}>
          {submitting ? "Saving…" : "Add Donor"}
        </PrimaryButton>
      </div>
    </form>
  );
}

export default function Donors() {
  const [donors, setDonors] = useState(null);
  const [query, setQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [viewDonorId, setViewDonorId] = useState(null);

  const [finderGroup, setFinderGroup] = useState("O-");
  const [finderResults, setFinderResults] = useState(null);
  const [finderOpen, setFinderOpen] = useState(false);

  function loadDonors() {
    api.get("/donors").then(({ data }) => setDonors(data.donors));
  }

  useEffect(loadDonors, []);

  useEffect(() => {
    const handle = setTimeout(() => {
      if (query.trim()) {
        api.get("/donors/search", { params: { q: query } }).then(({ data }) => setDonors(data.donors));
      } else {
        loadDonors();
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [query]);

  async function runSmartFinder() {
    setFinderOpen(true);
    const { data } = await api.get("/donors/smart-finder", { params: { bloodGroup: finderGroup } });
    setFinderResults(data);
  }

  return (
    <div className="space-y-6">
      <Card
        title="Donor Records"
        action={
          <PrimaryButton onClick={() => setAddOpen(true)}>
            <Plus size={16} /> Add Donor
          </PrimaryButton>
        }
      >
        <div className="mb-4 flex items-center gap-2">
          <Search size={16} className="text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, phone, email, or blood group…"
            className="w-full max-w-sm rounded-lg border border-stone-dark bg-white px-3 py-1.5 text-sm focus:border-crimson focus:outline-none focus:ring-1 focus:ring-crimson"
          />
        </div>

        {!donors ? (
          <Spinner />
        ) : donors.length === 0 ? (
          <EmptyState label="No donors found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-stone text-xs uppercase tracking-wide text-muted">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Blood Group</th>
                  <th className="py-2 pr-4">Phone</th>
                  <th className="py-2 pr-4">Last Donation</th>
                  <th className="py-2 pr-4">Total</th>
                  <th className="py-2 pr-4"></th>
                </tr>
              </thead>
              <tbody>
                {donors.map((d) => (
                  <tr key={d._id} className="border-b border-stone/60 hover:bg-paper">
                    <td className="py-2.5 pr-4 font-medium text-ink">{d.name}</td>
                    <td className="py-2.5 pr-4">
                      <Badge className="border-crimson/30 bg-crimson-light text-crimson">{d.bloodGroup}</Badge>
                    </td>
                    <td className="py-2.5 pr-4 font-mono text-xs text-muted">{d.phone}</td>
                    <td className="py-2.5 pr-4 text-muted">{formatDate(d.lastDonationDate)}</td>
                    <td className="py-2.5 pr-4 text-muted">{d.totalDonations}</td>
                    <td className="py-2.5 pr-4 text-right">
                      <button
                        onClick={() => setViewDonorId(d._id)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-crimson hover:underline"
                      >
                        <IdCard size={14} /> View card
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="Smart Donor Finder">
        <p className="mb-4 text-sm text-muted">
          Automatically surfaces eligible, compatible donors for a recipient blood group — useful when stock runs low.
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Recipient needs">
            <Select value={finderGroup} onChange={(e) => setFinderGroup(e.target.value)}>
              {BLOOD_GROUPS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </Select>
          </Field>
          <SecondaryButton onClick={runSmartFinder}>
            <Sparkles size={16} /> Find Eligible Donors
          </SecondaryButton>
        </div>

        {finderOpen && (
          <div className="mt-5">
            {!finderResults ? (
              <Spinner />
            ) : finderResults.donors.length === 0 ? (
              <EmptyState label="No eligible compatible donors found right now" />
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {finderResults.donors.slice(0, 9).map((d) => (
                  <div key={d._id} className="rounded-xl border border-stone p-3">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-ink">{d.name}</p>
                      <Badge className="border-crimson/30 bg-crimson-light text-crimson">{d.bloodGroup}</Badge>
                    </div>
                    <p className="mt-1 font-mono text-xs text-muted">{d.phone}</p>
                    <p className="mt-1 text-xs text-vital">
                      {d.eligibility.daysSinceLastDonation === null
                        ? "Never donated — eligible"
                        : `${d.eligibility.daysSinceLastDonation} days since last donation`}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Donor">
        <AddDonorForm
          onCreated={() => {
            setAddOpen(false);
            loadDonors();
          }}
          onCancel={() => setAddOpen(false)}
        />
      </Modal>

      <Modal open={!!viewDonorId} onClose={() => setViewDonorId(null)} title="Digital Donor Card">
        {viewDonorId && <DonorDetailModal donorId={viewDonorId} />}
      </Modal>
    </div>
  );
}
