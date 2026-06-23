import { useEffect, useState } from "react";
import { Users, Droplets, ClipboardList, Siren, AlertTriangle, Trophy } from "lucide-react";
import api from "../api/axios";
import StatCard from "../components/StatCard";
import Card from "../components/Card";
import { Spinner } from "../components/Status";
import Badge from "../components/Badge";
import { BLOOD_GROUPS } from "../utils/constants";

const PORTAL_COPY = {
  admin: {
    eyebrow: "Admin Portal",
    title: "System Oversight Dashboard",
    description: "Monitor inventory, donor activity, requests, and emergency response from the administrative command center.",
    hospitalCountLabel: "partner hospitals",
    hospitalCountSub: "managed across the network",
  },
  hospital: {
    eyebrow: "Hospital Portal",
    title: "Request & Supply Dashboard",
    description: "Track your request flow, emergency queues, and the supply status relevant to your hospital operations.",
    hospitalCountLabel: "network hospitals",
    hospitalCountSub: "available to accept requests",
  },
};

const PORTAL_STATS = {
  admin: [
    { label: "Total Donors", value: (data) => data.totalDonors, icon: Users, accent: "crimson" },
    {
      label: "Units Available",
      value: (data) => data.totalUnitsAvailable,
      icon: Droplets,
      accent: "vital",
      sub: "across all blood groups",
    },
    {
      label: "Pending Requests",
      value: (data) => data.pendingNormalRequests,
      icon: ClipboardList,
      accent: "amber",
      sub: (data) => `${data.fulfilledRequests} fulfilled all-time`,
    },
    {
      label: "Emergency Queue",
      value: (data) => data.pendingEmergencyRequests,
      icon: Siren,
      accent: "pulse",
      sub: "awaiting priority processing",
    },
  ],
  hospital: [
    {
      label: "Open Requests",
      value: (data) => data.pendingNormalRequests,
      icon: ClipboardList,
      accent: "amber",
      sub: (data) => `${data.fulfilledRequests} completed requests`,
    },
    {
      label: "Urgent Queue",
      value: (data) => data.pendingEmergencyRequests,
      icon: Siren,
      accent: "pulse",
      sub: "patients waiting on priority flow",
    },
    {
      label: "Supply Watch",
      value: (data) => data.expiringSoonCount,
      icon: AlertTriangle,
      accent: "crimson",
      sub: "units inside the warning window",
    },
    {
      label: "Stock Ready",
      value: (data) => data.totalUnitsAvailable,
      icon: Droplets,
      accent: "vital",
      sub: "available across the network",
    },
  ],
};

export default function Dashboard({ portal = "admin" }) {
  const [data, setData] = useState(null);
  const copy = PORTAL_COPY[portal] || PORTAL_COPY.admin;
  const stats = PORTAL_STATS[portal] || PORTAL_STATS.admin;

  useEffect(() => {
    api.get("/analytics/dashboard").then(({ data }) => setData(data));
  }, []);

  if (!data) return <Spinner label="Loading dashboard…" />;

  const maxStock = Math.max(1, ...Object.values(data.stockByGroup));

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.2em] text-muted">{copy.eyebrow}</p>
          <h2 className="font-display text-3xl font-semibold text-ink">{copy.title}</h2>
          <p className="max-w-3xl text-sm text-muted">{copy.description}</p>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value(data)}
            icon={stat.icon}
            accent={stat.accent}
            sub={typeof stat.sub === "function" ? stat.sub(data) : stat.sub}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card title={portal === "admin" ? "Stock by Blood Group" : "Supply Snapshot"} className="lg:col-span-2">
          {portal === "admin" ? (
            <div className="space-y-3">
              {BLOOD_GROUPS.map((g) => {
                const count = data.stockByGroup[g] || 0;
                const pct = Math.max(4, (count / maxStock) * 100);
                const color = count <= 4 ? "bg-pulse" : count <= 14 ? "bg-amber" : "bg-vital";
                return (
                  <div key={g} className="flex items-center gap-3">
                    <span className="w-10 font-mono text-sm text-ink">{g}</span>
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-stone">
                      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-10 text-right text-sm text-muted">{count}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {BLOOD_GROUPS.map((g) => {
                const count = data.stockByGroup[g] || 0;
                const low = count <= 4;
                return (
                  <div key={g} className="rounded-xl border border-stone p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm text-ink">{g}</span>
                      <Badge className={low ? "border-pulse/30 bg-pulse-light text-pulse" : "border-vital/30 bg-vital-light text-vital"}>
                        {count}
                      </Badge>
                    </div>
                    <p className="mt-2 text-xs text-muted">
                      {low ? "Low stock alert" : "Healthy stock level"}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card title={portal === "admin" ? "Quick Facts" : "Operational Alerts"}>
          <ul className="space-y-4 text-sm">
            <li className="flex items-start gap-3">
              <AlertTriangle size={18} className="mt-0.5 text-amber" />
              <div>
                <p className="font-medium text-ink">{data.expiringSoonCount} unit(s) expiring soon</p>
                <p className="text-muted">Within the configured alert window</p>
              </div>
            </li>
            {portal === "admin" ? (
              <>
                <li className="flex items-start gap-3">
                  <Trophy size={18} className="mt-0.5 text-crimson" />
                  <div>
                    <p className="font-medium text-ink">
                      {data.topDonor ? data.topDonor.name : "No donors yet"}
                    </p>
                    <p className="text-muted">
                      {data.topDonor ? `Top donor · ${data.topDonor.totalDonations} donations` : "Top donor will appear here"}
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Users size={18} className="mt-0.5 text-vital" />
                  <div>
                    <p className="font-medium text-ink">{data.totalHospitals} {copy.hospitalCountLabel}</p>
                    <p className="text-muted">{copy.hospitalCountSub}</p>
                  </div>
                </li>
              </>
            ) : (
              <>
                <li className="flex items-start gap-3">
                  <ClipboardList size={18} className="mt-0.5 text-vital" />
                  <div>
                    <p className="font-medium text-ink">Focus on open requests</p>
                    <p className="text-muted">Prioritize pending and emergency requests first</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Droplets size={18} className="mt-0.5 text-crimson" />
                  <div>
                    <p className="font-medium text-ink">Hospital supply lens</p>
                    <p className="text-muted">Watch low stock groups before placing the next request</p>
                  </div>
                </li>
              </>
            )}
          </ul>
          {data.pendingEmergencyRequests > 0 && (
            <div className="mt-5">
              <Badge className="bg-pulse-light text-pulse border-pulse/30">
                {data.pendingEmergencyRequests} emergency request(s) need attention
              </Badge>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
