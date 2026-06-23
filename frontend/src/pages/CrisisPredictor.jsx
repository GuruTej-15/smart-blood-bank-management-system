import { useEffect, useState } from "react";
import { TrendingDown, AlertOctagon } from "lucide-react";
import api from "../api/axios";
import Card from "../components/Card";
import Badge from "../components/Badge";
import { Spinner } from "../components/Status";

const STATUS_BADGE = {
  critical: "border-pulse/30 bg-pulse-light text-pulse",
  warning: "border-amber/30 bg-amber-light text-amber",
  stable: "border-vital/30 bg-vital-light text-vital",
};

export default function CrisisPredictor() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/crisis/predict").then(({ data }) => setData(data));
  }, []);

  if (!data) return <Spinner label="Running crisis prediction…" />;

  return (
    <div className="space-y-6">
      {data.atRisk.length > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-pulse/30 bg-pulse-light p-4">
          <AlertOctagon className="mt-0.5 shrink-0 text-pulse" size={20} />
          <div>
            <p className="font-medium text-pulse">{data.atRisk.length} blood group(s) at risk of shortage</p>
            <p className="mt-1 text-sm text-pulse/90">
              {data.atRisk.map((p) => `${p.bloodGroup} (${p.predictedDaysRemaining ?? "0"}d)`).join(" · ")}
            </p>
          </div>
        </div>
      )}

      <Card title="Blood Crisis Predictor">
        <p className="mb-4 flex items-center gap-2 text-sm text-muted">
          <TrendingDown size={15} /> Based on actual fulfilled-request usage over the last {data.basedOnWeeks} weeks.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-stone text-xs uppercase tracking-wide text-muted">
                <th className="py-2 pr-4">Blood Group</th>
                <th className="py-2 pr-4">Current Stock</th>
                <th className="py-2 pr-4">Avg Weekly Usage</th>
                <th className="py-2 pr-4">Predicted Days Remaining</th>
                <th className="py-2 pr-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.predictions.map((p) => (
                <tr key={p.bloodGroup} className="border-b border-stone/60">
                  <td className="py-2.5 pr-4 font-mono text-ink">{p.bloodGroup}</td>
                  <td className="py-2.5 pr-4 text-ink">{p.currentStock}</td>
                  <td className="py-2.5 pr-4 text-muted">{p.avgWeeklyUsage}</td>
                  <td className="py-2.5 pr-4 text-muted">
                    {p.predictedDaysRemaining === null ? "No usage trend" : `${p.predictedDaysRemaining} days`}
                  </td>
                  <td className="py-2.5 pr-4">
                    <Badge className={STATUS_BADGE[p.status]}>{p.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
