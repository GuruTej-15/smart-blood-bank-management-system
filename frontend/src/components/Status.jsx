import { Loader2, Inbox } from "lucide-react";

export function Spinner({ label = "Loading…" }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted">
      <Loader2 size={18} className="animate-spin" />
      {label}
    </div>
  );
}

export function EmptyState({ label = "Nothing here yet" }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-sm text-muted">
      <Inbox size={24} className="text-stone-dark" />
      {label}
    </div>
  );
}
