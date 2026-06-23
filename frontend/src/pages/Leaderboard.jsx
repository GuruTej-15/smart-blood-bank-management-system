import { useEffect, useState } from "react";
import { Trophy, Medal } from "lucide-react";
import api from "../api/axios";
import Card from "../components/Card";
import Badge from "../components/Badge";
import { Spinner, EmptyState } from "../components/Status";
import { REWARD_STYLES } from "../utils/constants";

const RANK_COLORS = ["text-amber", "text-muted", "text-[#92451c]"];

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState(null);

  useEffect(() => {
    api.get("/donors/leaderboard", { params: { limit: 15 } }).then(({ data }) => setLeaderboard(data.leaderboard));
  }, []);

  return (
    <div className="space-y-6">
      <Card title="Top Donor Leaderboard">
        <p className="mb-4 text-sm text-muted">
          Ranked live from the Max Heap by total lifetime donations. Encourages repeat donations through reward tiers.
        </p>
        {!leaderboard ? (
          <Spinner />
        ) : leaderboard.length === 0 ? (
          <EmptyState label="No donors ranked yet" />
        ) : (
          <ol className="space-y-2">
            {leaderboard.map((d, i) => (
              <li
                key={d._id}
                className={`flex items-center gap-4 rounded-xl border p-3 ${
                  i === 0 ? "border-amber/40 bg-amber-light/40" : "border-stone"
                }`}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone font-display text-sm font-semibold text-ink">
                  {i + 1}
                </span>
                {i < 3 ? (
                  <Trophy size={18} className={RANK_COLORS[i]} />
                ) : (
                  <Medal size={18} className="text-stone-dark" />
                )}
                <div className="flex-1">
                  <p className="font-medium text-ink">{d.name}</p>
                  <p className="text-xs text-muted">{d.bloodGroup}</p>
                </div>
                <Badge className={REWARD_STYLES[d.level]}>{d.level}</Badge>
                <span className="w-20 text-right font-mono text-sm text-ink">{d.totalDonations} units</span>
              </li>
            ))}
          </ol>
        )}
      </Card>
    </div>
  );
}
