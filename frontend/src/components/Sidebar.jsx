import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Droplets,
  ClipboardList,
  Siren,
  Building2,
  HeartHandshake,
  BarChart3,
  TrendingDown,
  Trophy,
  Radio,
  IdCard,
  LogOut,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getLandingPath } from "../utils/constants";

const NAV_ITEMS = {
  admin: [
    { to: (role) => getLandingPath(role), label: "Admin Portal", icon: LayoutDashboard, end: true },
    { to: "/donors", label: "Donors", icon: Users },
    { to: "/inventory", label: "Inventory", icon: Droplets },
    { to: "/requests", label: "Requests", icon: ClipboardList },
    { to: "/emergency", label: "Emergency", icon: Siren },
    { to: "/hospitals", label: "Hospitals", icon: Building2 },
    { to: "/donations", label: "Donations", icon: HeartHandshake },
    { to: "/analytics", label: "Analytics", icon: BarChart3 },
    { to: "/crisis", label: "Crisis Predictor", icon: TrendingDown },
    { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
    { to: "/broadcast", label: "Broadcast", icon: Radio },
  ],
  hospital: [
    { to: (role) => getLandingPath(role), label: "Hospital Portal", icon: LayoutDashboard, end: true },
    { to: "/requests", label: "Requests", icon: ClipboardList },
    { to: "/emergency", label: "Emergency", icon: Siren },
  ],
  donor: [
    { to: "/my-profile", label: "My Profile", icon: IdCard, end: true },
    { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
  ],
};

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-stone bg-white">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-crimson text-white">
          <Droplets size={18} />
        </div>
        <div>
          <p className="font-display text-base font-semibold leading-tight text-ink">Blood Bank</p>
          <p className="text-[11px] leading-tight text-muted">Emergency Response System</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3">
        {(NAV_ITEMS[user?.role] || []).map(({ to, label, icon: Icon, end }) => {
          const destination = typeof to === "function" ? to(user?.role) : to;
          const text = typeof label === "function" ? label(user?.role) : label;

          return (
            <NavLink
              key={destination}
              to={destination}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? "bg-crimson-light text-crimson" : "text-muted hover:bg-paper hover:text-ink"
                }`
              }
            >
              <Icon size={17} strokeWidth={2} />
              {text}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-stone px-3 py-3">
        <div className="flex items-center justify-between rounded-lg px-3 py-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink">{user?.name}</p>
            <p className="truncate text-xs capitalize text-muted">{user?.role}</p>
          </div>
          <button
            onClick={logout}
            title="Log out"
            className="rounded-md p-1.5 text-muted hover:bg-pulse-light hover:text-pulse"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
