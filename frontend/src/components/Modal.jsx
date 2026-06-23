import { X } from "lucide-react";

export default function Modal({ open, onClose, title, children, width = "max-w-lg" }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
      <div className={`w-full ${width} rounded-2xl border border-stone bg-white shadow-xl`}>
        <div className="flex items-center justify-between border-b border-stone px-5 py-4">
          <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
          <button onClick={onClose} className="rounded-md p-1 text-muted hover:bg-paper hover:text-ink">
            <X size={18} />
          </button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}
