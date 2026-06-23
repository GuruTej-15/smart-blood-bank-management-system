const Inventory = require("../models/Inventory");
const {
  store,
  syncInventoryAdd,
  syncInventoryRemove,
  syncInventoryStatusChange,
  getAllStockSnapshot,
} = require("../utils/store");

// ---------- CRUD ----------

async function addBatch(req, res) {
  const batch = await Inventory.create(req.body);
  syncInventoryAdd(batch.toObject());
  res.status(201).json(batch);
}

async function listBatches(req, res) {
  const { bloodGroup, status } = req.query;
  const filter = {};
  if (bloodGroup) filter.bloodGroup = bloodGroup;
  if (status) filter.status = status;
  const batches = await Inventory.find(filter).sort({ expiryDate: 1 });
  res.json({ count: batches.length, batches });
}

async function updateBatch(req, res) {
  const batch = await Inventory.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!batch) return res.status(404).json({ message: "Inventory batch not found" });
  syncInventoryStatusChange(batch.toObject());
  res.json(batch);
}

async function deleteBatch(req, res) {
  const batch = await Inventory.findByIdAndDelete(req.params.id);
  if (!batch) return res.status(404).json({ message: "Inventory batch not found" });
  syncInventoryRemove(batch.toObject());
  res.json({ message: "Batch removed", id: batch._id });
}

// ---------- Hash Table: Blood Group Lookup ----------

async function stockByGroup(req, res) {
  const { bloodGroup } = req.params;
  const units = store.inventoryByGroup.get(bloodGroup) || [];
  res.json({
    bloodGroup,
    totalUnits: units.reduce((sum, u) => sum + (u.units || 0), 0),
    batchCount: units.length,
    batches: units,
  });
}

async function stockSnapshot(req, res) {
  res.json({ snapshot: getAllStockSnapshot() });
}

// ---------- Min Heap: Blood Expiry Tracking ----------

async function expiringSoon(req, res) {
  const days = Number(req.query.days) || Number(process.env.EXPIRY_ALERT_DAYS) || 7;
  const units = store.expiryHeap.expiringWithin(days);
  res.json({ withinDays: days, count: units.length, units });
}

async function expiredUnits(req, res) {
  const units = store.expiryHeap.expired();
  res.json({ count: units.length, units });
}

/** Marks all currently-expired available batches as status "expired" in both DB and memory */
async function sweepExpired(req, res) {
  const expired = store.expiryHeap.expired();
  const ids = expired.map((u) => u._id);
  if (ids.length > 0) {
    await Inventory.updateMany({ _id: { $in: ids } }, { $set: { status: "expired" } });
  }
  expired.forEach((unit) => syncInventoryRemove(unit));
  res.json({ message: `Marked ${ids.length} batch(es) as expired`, ids });
}

module.exports = {
  addBatch,
  listBatches,
  updateBatch,
  deleteBatch,
  stockByGroup,
  stockSnapshot,
  expiringSoon,
  expiredUnits,
  sweepExpired,
};
