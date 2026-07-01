import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Droplets } from "lucide-react";
import api from "../api/axios";
import { Field, TextInput, PrimaryButton, SecondaryButton } from "../components/Form";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState("request");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function requestOtp(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/forgot-password/request", { email });
      setMessage(data.message || "If the email exists, an OTP has been sent");
      setStep("reset");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to send OTP");
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      await api.post("/auth/forgot-password/reset", { email, otp, newPassword });
      setMessage("Password reset successful. You can now sign in.");
      setTimeout(() => navigate("/login"), 900);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to reset password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-crimson text-white">
            <Droplets size={24} />
          </div>
          <h1 className="font-display text-2xl font-semibold text-ink">Reset your password</h1>
          <p className="mt-1 text-sm text-muted">Use your registered email to receive an OTP code.</p>
        </div>

        {step === "request" ? (
          <form onSubmit={requestOtp} className="space-y-4 rounded-2xl border border-stone bg-white p-6 shadow-sm">
            {error && <p className="rounded-lg bg-pulse-light px-3 py-2 text-sm text-pulse">{error}</p>}
            {message && <p className="rounded-lg bg-vital-light px-3 py-2 text-sm text-vital">{message}</p>}
            <Field label="Email">
              <TextInput
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </Field>
            <PrimaryButton type="submit" className="w-full" disabled={loading}>
              {loading ? "Sending OTP..." : "Send OTP"}
            </PrimaryButton>
          </form>
        ) : (
          <form onSubmit={resetPassword} className="space-y-4 rounded-2xl border border-stone bg-white p-6 shadow-sm">
            {error && <p className="rounded-lg bg-pulse-light px-3 py-2 text-sm text-pulse">{error}</p>}
            {message && <p className="rounded-lg bg-vital-light px-3 py-2 text-sm text-vital">{message}</p>}
            <Field label="Email">
              <TextInput
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </Field>
            <Field label="OTP">
              <TextInput
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                inputMode="numeric"
                maxLength={6}
              />
            </Field>
            <Field label="New password">
              <TextInput
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />
            </Field>
            <PrimaryButton type="submit" className="w-full" disabled={loading}>
              {loading ? "Updating..." : "Reset password"}
            </PrimaryButton>
            <SecondaryButton type="button" className="w-full" onClick={() => setStep("request")}>
              Request new OTP
            </SecondaryButton>
          </form>
        )}

        <p className="mt-4 text-center text-sm text-muted">
          Back to{" "}
          <Link to="/login" className="font-medium text-crimson hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
