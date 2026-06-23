import { useEffect, useState } from "react";
import api from "../api/axios";
import { BLOOD_GROUPS } from "../utils/constants";

function healthOf(count) {
  if (count <= 4) return "critical";
  if (count <= 14) return "low";
  return "healthy";
}

const HEALTH_COLOR = {
  critical: "bg-pulse",
  low: "bg-amber",
  healthy: "bg-vital",
};

const HEALTH_TEXT = {
  critical: "text-pulse",
  low: "text-amber",
  healthy: "text-vital",
};

// A small heartbeat-style bar: three bars of varying height per group,
// height scaled to stock level, the middle bar tallest (gives a "pulse" silhouette)
function HeartbeatTicks({ count, health }) {
  const scale = Math.min(1, count / 30);
  const base = 6;
  const heights = [base + scale * 6, base + scale * 16, base + scale * 9];
  return (
    <div className="flex items-end gap-[2px] h-6">
      {heights.map((h, i) => (
        <span
          key={i}
          className={`w-1 rounded-full ${HEALTH_COLOR[health]} ${health === "critical" ? "animate-breathe" : ""}`}
          style={{ height: `${h}px` }}
        />
      ))}
    </div>
  );
}

export default function PulseBar() {
  const [snapshot, setSnapshot] = useState(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const { data } = await api.get("/inventory/snapshot");
        if (active) setSnapshot(data.snapshot);
      } catch {
        // silent - pulse bar is a passive widget, not worth a full error state
      }
    }
    load();
    const id = setInterval(load, 30000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  return (
    <div className="flex items-center gap-5 overflow-x-auto border-b border-stone bg-white px-6 py-2.5">
      {BLOOD_GROUPS.map((group) => {
        const count = snapshot?.[group] ?? 0;
        const health = healthOf(count);
        return (
          <div key={group} className="flex shrink-0 items-center gap-2" title={`${group}: ${count} units available`}>
            <HeartbeatTicks count={count} health={health} />
            <div className="leading-tight">
              <p className="font-mono text-xs font-medium text-ink">{group}</p>
              <p className={`font-mono text-[11px] ${HEALTH_TEXT[health]}`}>{snapshot ? count : "···"}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
