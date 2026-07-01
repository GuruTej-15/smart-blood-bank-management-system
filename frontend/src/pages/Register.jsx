import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Droplets } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Field, TextInput, Select, PrimaryButton } from "../components/Form";
import GoogleAuthButton from "../components/GoogleAuthButton";
import { BLOOD_GROUPS, getLandingPath } from "../utils/constants";

export default function Register() {
  const { register, authenticateWithGoogle, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "donor",
    phone: "",
    bloodGroup: "O+",
    hospitalName: "",
    contactNumber: "",
    adminCode: "",
  });
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const user = await register(form);
      navigate(getLandingPath(user.role));
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    }
  }

  async function handleGoogleCredential(idToken) {
    setError("");
    try {
      const user = await authenticateWithGoogle({
        idToken,
        name: form.name,
        role: form.role,
        phone: form.phone,
        bloodGroup: form.bloodGroup,
        hospitalName: form.hospitalName,
        contactNumber: form.contactNumber,
        adminCode: form.adminCode,
      });
      navigate(getLandingPath(user.role));
    } catch (err) {
      setError(err.response?.data?.message || "Google registration failed");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-crimson text-white">
            <Droplets size={24} />
          </div>
          <h1 className="font-display text-2xl font-semibold text-ink">Create an account</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-stone bg-white p-6 shadow-sm">
          {error && <p className="rounded-lg bg-pulse-light px-3 py-2 text-sm text-pulse">{error}</p>}
          <Field label="Full name">
            <TextInput required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Email">
            <TextInput
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </Field>
          <Field label="Password">
            <TextInput
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </Field>
          <Field label="Role">
            <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="donor">Donor</option>
              <option value="hospital">Hospital staff</option>
              <option value="admin">Blood bank admin</option>
            </Select>
          </Field>

          {form.role === "donor" && (
            <>
              <Field label="Phone">
                <TextInput
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </Field>
              <Field label="Blood group">
                <Select value={form.bloodGroup} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}>
                  {BLOOD_GROUPS.map((group) => (
                    <option key={group} value={group}>
                      {group}
                    </option>
                  ))}
                </Select>
              </Field>
            </>
          )}

          {form.role === "hospital" && (
            <>
              <Field label="Hospital name">
                <TextInput
                  required
                  value={form.hospitalName}
                  onChange={(e) => setForm({ ...form, hospitalName: e.target.value })}
                />
              </Field>
              <Field label="Contact number">
                <TextInput
                  required
                  value={form.contactNumber}
                  onChange={(e) => setForm({ ...form, contactNumber: e.target.value })}
                />
              </Field>
            </>
          )}

          {form.role === "admin" && (
            <Field label="Admin invite code">
              <TextInput
                required
                value={form.adminCode}
                onChange={(e) => setForm({ ...form, adminCode: e.target.value })}
              />
            </Field>
          )}

          <PrimaryButton type="submit" disabled={loading} className="w-full">
            {loading ? "Creating account…" : "Create account"}
          </PrimaryButton>
          <div className="flex justify-center pt-1">
            <GoogleAuthButton onCredential={handleGoogleCredential} text="signup_with" disabled={loading} />
          </div>
        </form>

        <p className="mt-4 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-crimson hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
