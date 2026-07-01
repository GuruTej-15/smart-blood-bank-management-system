import { useEffect, useRef, useState } from "react";

const GOOGLE_SCRIPT_SRC = "https://accounts.google.com/gsi/client";

function loadGoogleScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }

    const existing = document.querySelector(`script[src='${GOOGLE_SCRIPT_SRC}']`);
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Failed to load Google script")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = GOOGLE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google script"));
    document.head.appendChild(script);
  });
}

export default function GoogleAuthButton({ onCredential, text = "continue_with", disabled = false }) {
  const containerRef = useRef(null);
  const [error, setError] = useState("");
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const labelByText = {
    continue_with: "Continue with Google",
    signin_with: "Sign in with Google",
    signup_with: "Sign up with Google",
  };
  const fallbackLabel = labelByText[text] || "Continue with Google";

  useEffect(() => {
    let mounted = true;

    async function init() {
      if (!clientId || !containerRef.current) {
        return;
      }

      try {
        await loadGoogleScript();
        if (!mounted || !window.google?.accounts?.id) {
          return;
        }

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (!response?.credential || disabled) {
              return;
            }
            onCredential(response.credential);
          },
        });

        containerRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(containerRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text,
          width: 320,
        });
      } catch (err) {
        if (mounted) {
          setError(err.message || "Google sign-in is unavailable");
        }
      }
    }

    init();

    return () => {
      mounted = false;
    };
  }, [clientId, disabled, onCredential, text]);

  return (
    <div className="space-y-2">
      {clientId ? (
        <div ref={containerRef} className={disabled ? "pointer-events-none opacity-50" : ""} />
      ) : (
        <button
          type="button"
          disabled
          className="inline-flex h-11 w-full max-w-[320px] items-center justify-center rounded-full border border-stone-dark bg-white px-4 text-sm font-medium text-ink opacity-70"
        >
          {fallbackLabel}
        </button>
      )}
      {error && <p className="text-xs text-pulse">{error}</p>}
      {!clientId && <p className="text-xs text-muted">Set VITE_GOOGLE_CLIENT_ID to enable Google sign-in.</p>}
    </div>
  );
}
