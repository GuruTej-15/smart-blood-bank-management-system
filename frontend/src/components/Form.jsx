export function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ink">{label}</span>
      {children}
    </label>
  );
}

const baseInput =
  "w-full rounded-lg border border-stone-dark bg-white px-3 py-2 text-sm text-ink placeholder:text-muted/60 focus:border-crimson focus:outline-none focus:ring-1 focus:ring-crimson";

export function TextInput(props) {
  return <input {...props} className={`${baseInput} ${props.className || ""}`} />;
}

export function Select({ children, ...props }) {
  return (
    <select {...props} className={`${baseInput} ${props.className || ""}`}>
      {children}
    </select>
  );
}

export function TextArea(props) {
  return <textarea {...props} className={`${baseInput} ${props.className || ""}`} />;
}

export function PrimaryButton({ children, className = "", ...props }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-lg bg-crimson px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-crimson-dark disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({ children, className = "", ...props }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-lg border border-stone-dark bg-white px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-paper disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

export function DangerButton({ children, className = "", ...props }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-lg bg-pulse px-4 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}
