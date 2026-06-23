export default function Card({ title, action, children, className = "" }) {
  return (
    <div className={`rounded-2xl border border-stone bg-white shadow-sm ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between border-b border-stone px-5 py-4">
          {title && <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>}
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}
