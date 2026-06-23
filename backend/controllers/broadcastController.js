const Broadcast = require("../models/Broadcast");
const { triggerBroadcast } = require("../utils/broadcastService");
const { getAvailableUnitCount } = require("../utils/store");
const { BLOOD_GROUPS } = require("../utils/constants");

async function manualTrigger(req, res) {
  const { bloodGroup, reason } = req.body;
  if (!bloodGroup) return res.status(400).json({ message: "bloodGroup is required" });
  const broadcast = await triggerBroadcast(bloodGroup, reason || "manual");
  res.status(201).json(broadcast);
}

/** Checks every blood group against LOW_STOCK_THRESHOLD and broadcasts for any that qualify */
async function autoCheckLowStock(req, res) {
  const threshold = Number(process.env.LOW_STOCK_THRESHOLD) || 10;
  const triggered = [];
  for (const group of BLOOD_GROUPS) {
    const stock = getAvailableUnitCount(group);
    if (stock < threshold) {
      const broadcast = await triggerBroadcast(group, "low_stock");
      triggered.push({ bloodGroup: group, stock, broadcastId: broadcast._id });
    }
  }
  res.json({ threshold, triggeredCount: triggered.length, triggered });
}

async function history(req, res) {
  const broadcasts = await Broadcast.find().sort({ createdAt: -1 }).limit(50);
  res.json({ count: broadcasts.length, broadcasts });
}

module.exports = { manualTrigger, autoCheckLowStock, history };
