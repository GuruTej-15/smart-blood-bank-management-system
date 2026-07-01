const Donor = require("../models/Donor");
const Donation = require("../models/Donation");
const Request = require("../models/Request");
const Hospital = require("../models/Hospital");
const Inventory = require("../models/Inventory");
const { BLOOD_GROUPS } = require("../utils/constants");

// ---------- Dashboard ----------

async function dashboardSummary(req, res) {
  const [
    totalDonors,
    totalHospitals,
    pendingNormalRequests,
    pendingEmergencyRequests,
    fulfilledRequests,
    expiringSoonCount,
    topDonor,
    stockRows,
  ] = await Promise.all([
    Donor.countDocuments(),
    Hospital.countDocuments(),
    Request.countDocuments({ status: "pending", isEmergency: false }),
    Request.countDocuments({ status: "pending", isEmergency: true }),
    Request.countDocuments({ status: "fulfilled" }),
    Inventory.countDocuments({
      status: "available",
      expiryDate: { $lte: new Date(Date.now() + (Number(process.env.EXPIRY_ALERT_DAYS) || 7) * 24 * 60 * 60 * 1000) },
    }),
    Donor.findOne().sort({ totalDonations: -1 }).lean(),
    Inventory.aggregate([
      { $match: { status: "available" } },
      { $group: { _id: "$bloodGroup", totalUnits: { $sum: "$units" } } },
    ]),
  ]);

  const snapshot = BLOOD_GROUPS.reduce((acc, group) => {
    acc[group] = 0;
    return acc;
  }, {});
  stockRows.forEach((row) => {
    snapshot[row._id] = row.totalUnits;
  });

  const totalUnitsAvailable = Object.values(snapshot).reduce((a, b) => a + b, 0);

  res.json({
    totalDonors,
    totalHospitals,
    totalUnitsAvailable,
    stockByGroup: snapshot,
    pendingNormalRequests,
    pendingEmergencyRequests,
    fulfilledRequests,
    expiringSoonCount,
    topDonor: topDonor || null,
  });
}

// ---------- Most demanded blood groups ----------

async function mostDemanded(req, res) {
  const results = await Request.aggregate([
    { $group: { _id: "$bloodGroup", totalUnitsRequested: { $sum: "$unitsRequired" }, requestCount: { $sum: 1 } } },
    { $sort: { totalUnitsRequested: -1 } },
  ]);
  res.json({ mostDemanded: results.map((r) => ({ bloodGroup: r._id, ...r, _id: undefined })) });
}

// ---------- Monthly donations / requests ----------

async function monthlyDonations(req, res) {
  const results = await Donation.aggregate([
    {
      $group: {
        _id: { year: { $year: "$date" }, month: { $month: "$date" } },
        totalUnits: { $sum: "$unitsDonated" },
        donationCount: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);
  res.json({
    monthlyDonations: results.map((r) => ({
      year: r._id.year,
      month: r._id.month,
      totalUnits: r.totalUnits,
      donationCount: r.donationCount,
    })),
  });
}

async function monthlyRequests(req, res) {
  const results = await Request.aggregate([
    {
      $group: {
        _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
        totalUnitsRequested: { $sum: "$unitsRequired" },
        requestCount: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);
  res.json({
    monthlyRequests: results.map((r) => ({
      year: r._id.year,
      month: r._id.month,
      totalUnitsRequested: r.totalUnitsRequested,
      requestCount: r.requestCount,
    })),
  });
}

// ---------- Stock trend (current snapshot, all groups) ----------

async function stockTrend(req, res) {
  const rows = await Inventory.aggregate([
    { $match: { status: "available" } },
    { $group: { _id: "$bloodGroup", totalUnits: { $sum: "$units" } } },
  ]);
  const snapshot = BLOOD_GROUPS.reduce((acc, group) => {
    acc[group] = 0;
    return acc;
  }, {});
  rows.forEach((row) => {
    snapshot[row._id] = row.totalUnits;
  });
  res.json({ snapshot });
}

// ---------- AI-Based Demand Insights (Simulation) ----------
// NOTE: This is an explicitly labelled simulation - a simple moving-average
// projection over historical request volume, not a trained ML model.

async function demandInsights(req, res) {
  const weeksOfHistory = 6;
  const since = new Date(Date.now() - weeksOfHistory * 7 * 24 * 60 * 60 * 1000);

  const [requests, stockRows] = await Promise.all([
    Request.find({ createdAt: { $gte: since } }).select("bloodGroup unitsRequired createdAt").lean(),
    Inventory.aggregate([
      { $match: { status: "available" } },
      { $group: { _id: "$bloodGroup", totalUnits: { $sum: "$units" } } },
    ]),
  ]);

  const stockByGroup = BLOOD_GROUPS.reduce((acc, group) => {
    acc[group] = 0;
    return acc;
  }, {});
  stockRows.forEach((row) => {
    stockByGroup[row._id] = row.totalUnits;
  });

  const insights = BLOOD_GROUPS.map((group) => {
    const groupRequests = requests.filter((r) => r.bloodGroup === group);
    const totalUnits = groupRequests.reduce((sum, r) => sum + r.unitsRequired, 0);
    const avgWeeklyDemand = Number((totalUnits / weeksOfHistory).toFixed(2));
    const currentStock = stockByGroup[group] || 0;
    const projectedNextWeekDemand = avgWeeklyDemand; // simple moving-average projection
    const weeksOfStockRemaining =
      avgWeeklyDemand > 0 ? Number((currentStock / avgWeeklyDemand).toFixed(1)) : null;

    return {
      bloodGroup: group,
      currentStock,
      avgWeeklyDemand,
      projectedNextWeekDemand,
      weeksOfStockRemaining,
      riskLevel:
        weeksOfStockRemaining === null
          ? "unknown"
          : weeksOfStockRemaining < 1
          ? "high"
          : weeksOfStockRemaining < 2
          ? "medium"
          : "low",
    };
  });

  res.json({ simulation: true, basedOnWeeks: weeksOfHistory, insights });
}

module.exports = {
  dashboardSummary,
  mostDemanded,
  monthlyDonations,
  monthlyRequests,
  stockTrend,
  demandInsights,
};
