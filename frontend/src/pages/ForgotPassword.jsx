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
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [resetTokenExpiresAt, setResetTokenExpiresAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function requestOtp(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");
      setResetToken("");
      setResetTokenExpiresAt("");
      const { data } = await api.post("/auth/forgot-password", { email });
      setMessage(data.message || "If the email exists, a verification code has been sent");
      setStep("verify");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to send verification code");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/verify-reset-otp", { email, otp });
      setResetToken(data.resetToken);
      setResetTokenExpiresAt(data.resetTokenExpiresAt || "");
      setMessage(data.message || "Verification code accepted");
      setStep("reset");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to verify code");
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
      await api.post("/auth/reset-password", { email, resetToken, newPassword, confirmPassword });
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
          <p className="mt-1 text-sm text-muted">Request a code, verify it, then set a new password.</p>
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
              {loading ? "Sending code..." : "Send verification code"}
            </PrimaryButton>
          </form>
        ) : step === "verify" ? (
          <form onSubmit={verifyOtp} className="space-y-4 rounded-2xl border border-stone bg-white p-6 shadow-sm">
            {error && <p className="rounded-lg bg-pulse-light px-3 py-2 text-sm text-pulse">{error}</p>}
            {message && <p className="rounded-lg bg-vital-light px-3 py-2 text-sm text-vital">{message}</p>}
            <div className="rounded-xl border border-stone bg-paper px-4 py-3 text-sm text-muted">
              <p className="font-medium text-ink">Verification code sent</p>
              <p className="mt-1">Enter the 6-digit code from your email to continue.</p>
            </div>
            <Field label="Email">
              <TextInput
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </Field>
            <Field label="Verification code">
              <TextInput
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                inputMode="numeric"
                maxLength={6}
                autoComplete="one-time-code"
              />
            </Field>
            <PrimaryButton type="submit" className="w-full" disabled={loading}>
              {loading ? "Verifying..." : "Verify code"}
            </PrimaryButton>
            <SecondaryButton type="button" className="w-full" onClick={() => setStep("request")}>
              Request new code
            </SecondaryButton>
          </form>
        ) : (
          <form onSubmit={resetPassword} className="space-y-4 rounded-2xl border border-stone bg-white p-6 shadow-sm">
            {error && <p className="rounded-lg bg-pulse-light px-3 py-2 text-sm text-pulse">{error}</p>}
            {message && <p className="rounded-lg bg-vital-light px-3 py-2 text-sm text-vital">{message}</p>}
            {resetTokenExpiresAt && (
              <div className="rounded-xl border border-stone bg-paper px-4 py-3 text-sm text-muted">
                Reset session active until {new Date(resetTokenExpiresAt).toLocaleString()}.
              </div>
            )}
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
            <Field label="Confirm password">
              <TextInput
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
            </Field>
            <p className="text-xs leading-6 text-muted">
              Use at least 8 characters with uppercase, lowercase, a number, and a special character.
            </p>
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
