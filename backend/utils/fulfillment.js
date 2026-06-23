const Inventory = require("../models/Inventory");
const { store, syncInventoryRemove, syncInventoryStatusChange } = require("./store");

/**
 * Attempts to satisfy `unitsNeeded` of `bloodGroup` from available stock,
 * consuming the soonest-to-expire batches first (FEFO - First Expiring,
 * First Out) so the Min Heap's expiry tracking directly drives allocation
 * and minimises wastage.
 *
 * Returns { fulfilledUnits, shortfall, consumedBatches }
 * Mutates the database and the in-memory store for any batch it touches.
 */
async function consumeUnits(bloodGroup, unitsNeeded) {
  const available = [...(store.inventoryByGroup.get(bloodGroup) || [])].sort(
    (a, b) => new Date(a.expiryDate) - new Date(b.expiryDate)
  );

  let remaining = unitsNeeded;
  const consumedBatches = [];

  for (const batch of available) {
    if (remaining <= 0) break;
    const take = Math.min(batch.units, remaining);
    remaining -= take;
    consumedBatches.push({ batchId: batch._id, bloodGroup, unitsTaken: take });

    if (take === batch.units) {
      // Whole batch consumed
      const updated = await Inventory.findByIdAndUpdate(batch._id, { status: "used" }, { new: true });
      if (updated) syncInventoryStatusChange(updated.toObject());
    } else {
      // Partial consumption: reduce remaining units, batch stays available
      const updated = await Inventory.findByIdAndUpdate(
        batch._id,
        { $inc: { units: -take } },
        { new: true }
      );
      if (updated) {
        syncInventoryRemove(batch);
        syncInventoryStatusChange(updated.toObject());
      }
    }
  }

  return {
    fulfilledUnits: unitsNeeded - remaining,
    shortfall: remaining,
    consumedBatches,
  };
}

module.exports = { consumeUnits };
