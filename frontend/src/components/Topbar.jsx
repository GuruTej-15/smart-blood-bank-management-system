import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Siren } from "lucide-react";
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

export default function Topbar() {
  const location = useLocation();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const title = TITLES[location.pathname] || "Smart Blood Bank";
  const showEmergencyAction = user?.role !== "donor";

  return (
    <>
      <header className="flex items-center justify-between border-b border-stone bg-white px-6 py-4">
        <h1 className="font-display text-2xl font-semibold text-ink">{title}</h1>
        {showEmergencyAction ? (
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-pulse px-4 py-2 text-sm font-semibold text-white shadow-sm transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <Siren size={16} className="animate-breathe" />
            New Emergency Request
          </button>
        ) : null}
      </header>

      {showEmergencyAction ? (
        <Modal open={open} onClose={() => setOpen(false)} title="Submit Emergency Request">
          <EmergencyRequestForm onCreated={() => setOpen(false)} onCancel={() => setOpen(false)} />
        </Modal>
      ) : null}
    </>
  );
}
