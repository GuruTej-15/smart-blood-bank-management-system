import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from "recharts";
import api from "../api/axios";
import Card from "../components/Card";
import Badge from "../components/Badge";
import { Spinner } from "../components/Status";

const MONTH_NAMES = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const RISK_BADGE = {
  high: "border-pulse/30 bg-pulse-light text-pulse",
  medium: "border-amber/30 bg-amber-light text-amber",
  low: "border-vital/30 bg-vital-light text-vital",
  unknown: "border-stone-dark bg-stone text-muted",
};

export default function Analytics() {
  const [mostDemanded, setMostDemanded] = useState(null);
  const [monthly, setMonthly] = useState(null);
  const [insights, setInsights] = useState(null);

  useEffect(() => {
    api.get("/analytics/most-demanded").then(({ data }) => setMostDemanded(data.mostDemanded));
    api.get("/analytics/demand-insights").then(({ data }) => setInsights(data.insights));
    Promise.all([api.get("/analytics/monthly-donations"), api.get("/analytics/monthly-requests")]).then(
      ([donationsRes, requestsRes]) => {
        const merged = {};
        donationsRes.data.monthlyDonations.forEach((m) => {
          const key = `${m.year}-${m.month}`;
          merged[key] = { label: `${MONTH_NAMES[m.month]} '${String(m.year).slice(2)}`, donations: m.totalUnits, requests: 0 };
        });
        requestsRes.data.monthlyRequests.forEach((m) => {
          const key = `${m.year}-${m.month}`;
          if (!merged[key]) merged[key] = { label: `${MONTH_NAMES[m.month]} '${String(m.year).slice(2)}`, donations: 0, requests: 0 };
          merged[key].requests = m.totalUnitsRequested;
        });
        setMonthly(Object.values(merged));
      }
    );
  }, []);

  return (
    <div className="space-y-6">
      <Card title="Most Demanded Blood Groups">
        {!mostDemanded ? (
          <Spinner />
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={mostDemanded}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" />
              <XAxis dataKey="bloodGroup" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="totalUnitsRequested" fill="#9F1239" radius={[6, 6, 0, 0]} name="Units requested" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      <Card title="Monthly Donations vs Requests">
        {!monthly ? (
          <Spinner />
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="donations" stroke="#15803D" strokeWidth={2} name="Units donated" />
              <Line type="monotone" dataKey="requests" stroke="#DC2626" strokeWidth={2} name="Units requested" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>

      <Card title="AI-Based Demand Insights (Simulation)">
        <p className="mb-4 text-sm text-muted">
          A moving-average projection over the last 6 weeks of request history — a simulated insight, not a trained
          ML model.
        </p>
        {!insights ? (
          <Spinner />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-stone text-xs uppercase tracking-wide text-muted">
                  <th className="py-2 pr-4">Group</th>
                  <th className="py-2 pr-4">Current Stock</th>
                  <th className="py-2 pr-4">Avg Weekly Demand</th>
                  <th className="py-2 pr-4">Weeks of Stock Left</th>
                  <th className="py-2 pr-4">Risk</th>
                </tr>
              </thead>
              <tbody>
                {insights.map((i) => (
                  <tr key={i.bloodGroup} className="border-b border-stone/60">
                    <td className="py-2.5 pr-4 font-mono text-ink">{i.bloodGroup}</td>
                    <td className="py-2.5 pr-4 text-ink">{i.currentStock}</td>
                    <td className="py-2.5 pr-4 text-muted">{i.avgWeeklyDemand}</td>
                    <td className="py-2.5 pr-4 text-muted">{i.weeksOfStockRemaining ?? "—"}</td>
                    <td className="py-2.5 pr-4">
                      <Badge className={RISK_BADGE[i.riskLevel]}>{i.riskLevel}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
