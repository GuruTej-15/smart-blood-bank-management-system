export default function Badge({ children, className = "" }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${className}`}
    >
      {children}
    </span>
  );
}
