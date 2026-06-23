const Request = require("../models/Request");
const { store, getAllStockSnapshot } = require("../utils/store");
const { BLOOD_GROUPS } = require("../utils/constants");

/**
 * Blood Crisis Predictor
 * Looks at how many units of each blood group were actually used
 * (fulfilled requests) over the last `weeksOfHistory` weeks, derives an
 * average weekly usage rate, and projects how many days of stock remain
 * at that rate. Example from the spec: stock=20, avgWeeklyUsage=8 ->
 * predicted shortage within ~2 weeks (20 / (8/7) ≈ 17.5 days).
 */
async function predict(req, res) {
  const weeksOfHistory = Number(req.query.weeks) || 8;
  const since = new Date(Date.now() - weeksOfHistory * 7 * 24 * 60 * 60 * 1000);

  const fulfilled = await Request.find({
    status: "fulfilled",
    decidedAt: { $gte: since },
  }).select("bloodGroup unitsRequired");

  const snapshot = getAllStockSnapshot();

  const predictions = BLOOD_GROUPS.map((group) => {
    const used = fulfilled
      .filter((r) => r.bloodGroup === group)
      .reduce((sum, r) => sum + r.unitsRequired, 0);
    const avgWeeklyUsage = Number((used / weeksOfHistory).toFixed(2));
    const currentStock = snapshot[group] || 0;
    const dailyUsage = avgWeeklyUsage / 7;
    const predictedDaysRemaining = dailyUsage > 0 ? Math.floor(currentStock / dailyUsage) : null;

    let status = "stable";
    if (predictedDaysRemaining !== null) {
      if (predictedDaysRemaining <= 7) status = "critical";
      else if (predictedDaysRemaining <= 14) status = "warning";
    } else if (currentStock === 0) {
      status = "critical";
    }

    return {
      bloodGroup: group,
      currentStock,
      avgWeeklyUsage,
      predictedDaysRemaining,
      status, // "critical" | "warning" | "stable"
    };
  });

  const atRisk = predictions.filter((p) => p.status !== "stable").sort((a, b) => {
    const rank = { critical: 0, warning: 1 };
    return rank[a.status] - rank[b.status];
  });

  res.json({ basedOnWeeks: weeksOfHistory, predictions, atRisk });
}

module.exports = { predict };
