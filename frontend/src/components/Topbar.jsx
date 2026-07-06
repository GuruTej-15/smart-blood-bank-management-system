import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Menu, Siren } from "lucide-react";
import Modal from "./Modal";
import EmergencyRequestForm from "./EmergencyRequestForm";
import { useAuth } from "../context/AuthContext";

const TITLES = {
  "/": "Portal",
  "/admin-portal": "Admin Portal",
  "/hospital-portal": "Hospital Portal",
  "/my-profile": "My Profile",
  "/donors": "Donors",
  "/inventory": "Blood Inventory",
  "/requests": "Blood Requests",
  "/emergency": "Emergency Requests",
  "/hospitals": "Hospitals",
  "/donations": "Donations",
  "/analytics": "Analytics",
  "/crisis": "Blood Crisis Predictor",
  "/leaderboard": "Top Donor Leaderboard",
  "/broadcast": "Emergency Broadcast",
};

export default function Topbar({ onOpenSidebar }) {
  const location = useLocation();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const title = TITLES[location.pathname] || "Smart Blood Bank";
  const showEmergencyAction = user?.role === "hospital";

  return (
    <>
      <header className="flex items-center justify-between border-b border-stone bg-white/95 px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Open navigation"
            onClick={onOpenSidebar}
            className="rounded-lg border border-stone p-2 text-muted transition-colors hover:bg-paper hover:text-ink lg:hidden"
          >
            <Menu size={18} />
          </button>
          <h1 className="font-display text-xl font-semibold text-ink sm:text-2xl">{title}</h1>
        </div>
        {showEmergencyAction ? (
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-pulse px-3 py-2 text-sm font-semibold text-white shadow-sm transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <Siren size={16} className="animate-breathe" />
            <span className="hidden sm:inline">New Emergency Request</span>
            <span className="sm:hidden">Emergency</span>
          </button>
        ) : null}
      </header>

      {showEmergencyAction ? (
        <Modal open={open} onClose={() => setOpen(false)} title="Submit Emergency Request">
          <EmergencyRequestForm
            initialHospitalId={user?.hospital}
            onCreated={() => setOpen(false)}
            onCancel={() => setOpen(false)}
          />
        </Modal>
      ) : null}
    </>
  );
}
