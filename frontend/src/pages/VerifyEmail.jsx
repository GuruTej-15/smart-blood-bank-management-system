import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Droplets } from "lucide-react";
import api from "../api/axios";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const email = searchParams.get("email");
    const token = searchParams.get("token");

    if (!email || !token) {
      setStatus("error");
      setMessage("The verification link is missing required details.");
      return;
    }

    async function verify() {
      try {
        const { data } = await api.post("/auth/verify-email", { email, token });
        setStatus("success");
        setMessage(data.message || "Email verified successfully.");
      } catch (err) {
        setStatus("error");
        setMessage(err.response?.data?.message || "Unable to verify email.");
      }
    }

    verify();
  }, [searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm rounded-2xl border border-stone bg-white p-6 shadow-sm text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-crimson text-white mx-auto">
          <Droplets size={24} />
        </div>
        <h1 className="font-display text-2xl font-semibold text-ink">Email verification</h1>
        <p className="mt-2 text-sm text-muted">
          {status === "loading" && "Verifying your email address..."}
          {status === "success" && message}
          {status === "error" && message}
        </p>
        <div className="mt-6">
          <Link to="/login" className="font-medium text-crimson hover:underline">
            Go to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
