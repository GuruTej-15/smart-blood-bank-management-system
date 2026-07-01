import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Droplets } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Field, TextInput, PrimaryButton } from "../components/Form";
import GoogleAuthButton from "../components/GoogleAuthButton";
import { getLandingPath } from "../utils/constants";

export default function Login() {
  const { login, authenticateWithGoogle, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const user = await login(email, password);
      navigate(getLandingPath(user.role));
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  }

  async function handleGoogleCredential(idToken) {
    setError("");
    try {
      const user = await authenticateWithGoogle({ idToken });
      navigate(getLandingPath(user.role));
    } catch (err) {
      setError(err.response?.data?.message || "Google sign-in failed");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-crimson text-white">
            <Droplets size={24} />
          </div>
          <h1 className="font-display text-2xl font-semibold text-ink">Smart Blood Bank</h1>
          <p className="mt-1 text-sm text-muted">Management & Emergency Response System</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-stone bg-white p-6 shadow-sm">
          {error && <p className="rounded-lg bg-pulse-light px-3 py-2 text-sm text-pulse">{error}</p>}
          <Field label="Email">
            <TextInput type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </Field>
          <Field label="Password">
            <TextInput type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          </Field>
          <PrimaryButton type="submit" disabled={loading} className="w-full">
            {loading ? "Signing in…" : "Sign in"}
          </PrimaryButton>
          <p className="text-right text-xs">
            <Link to="/forgot-password" className="font-medium text-crimson hover:underline">
              Forgot password?
            </Link>
          </p>
          <div className="flex justify-center pt-1">
            <GoogleAuthButton onCredential={handleGoogleCredential} text="signin_with" disabled={loading} />
          </div>
        </form>

        <p className="mt-4 text-center text-sm text-muted">
          Don't have an account?{" "}
          <Link to="/register" className="font-medium text-crimson hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
