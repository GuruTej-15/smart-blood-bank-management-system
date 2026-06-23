export default function StatCard({ label, value, icon: Icon, accent = "crimson", sub }) {
  const accentMap = {
    crimson: "text-crimson bg-crimson-light",
    vital: "text-vital bg-vital-light",
    amber: "text-amber bg-amber-light",
    pulse: "text-pulse bg-pulse-light",
  };
  return (
    <div className="rounded-2xl border border-stone bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted">{label}</p>
          <p className="mt-1 font-display text-3xl font-semibold text-ink">{value}</p>
          {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
        </div>
        {Icon && (
          <div className={`rounded-xl p-2.5 ${accentMap[accent]}`}>
            <Icon size={20} strokeWidth={2} />
          </div>
        )}
      </div>
    </div>
  );
}
