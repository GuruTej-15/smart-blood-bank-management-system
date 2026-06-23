/**
 * store.js
 * --------
 * MongoDB is the source of truth (durable, survives restarts). On top of
 * it, this module keeps the six required data structures live in memory
 * so day-to-day operations (lookups, queue processing, leaderboards,
 * expiry checks) run against fast in-memory structures instead of
 * re-querying/re-sorting the database on every request.
 *
 * Pattern: every controller that mutates data calls the matching
 * `sync*` helper here right after writing to Mongo, so the in-memory
 * structures never drift out of sync. `initStore()` rebuilds everything
 * from the database once at server startup.
 */

const HashTable = require("../dataStructures/HashTable");
const LinkedList = require("../dataStructures/LinkedList");
const Queue = require("../dataStructures/Queue");
const { PriorityQueue } = require("../dataStructures/PriorityQueue");
const MinHeap = require("../dataStructures/MinHeap");
const MaxHeap = require("../dataStructures/MaxHeap");

const Donor = require("../models/Donor");
const Inventory = require("../models/Inventory");
const Request = require("../models/Request");
const { BLOOD_GROUPS } = require("./constants");

const store = {
  // bloodGroup -> array of available Inventory docs (Hash Table: Blood Group Lookup)
  inventoryByGroup: new HashTable(),
  // all donor records (Linked List: Donor Records)
  donorList: new LinkedList(),
  // pending normal requests, FCFS (Queue)
  normalQueue: new Queue(),
  // pending emergency requests, most urgent first (Priority Queue / Max Heap)
  emergencyQueue: new PriorityQueue(),
  // available inventory units, soonest-to-expire first (Min Heap)
  expiryHeap: new MinHeap(),
  // donors, highest totalDonations first (Max Heap)
  donorRankHeap: new MaxHeap(),

  ready: false,
};

async function initStore() {
  const [donors, availableUnits, pendingRequests] = await Promise.all([
    Donor.find().lean(),
    Inventory.find({ status: "available" }).lean(),
    Request.find({ status: "pending" }).sort({ createdAt: 1 }).lean(),
  ]);

  store.donorList.clear();
  store.donorRankHeap.clear();
  donors.forEach((d) => {
    store.donorList.insertAtEnd(d);
    store.donorRankHeap.insert(d);
  });

  store.inventoryByGroup.clear();
  store.expiryHeap.clear();
  availableUnits.forEach((unit) => {
    store.inventoryByGroup.pushToBucketValue(unit.bloodGroup, unit);
    store.expiryHeap.insert(unit);
  });

  store.normalQueue.clear();
  store.emergencyQueue.clear();
  pendingRequests.forEach((r) => {
    if (r.isEmergency) store.emergencyQueue.enqueue(r);
    else store.normalQueue.enqueue(r);
  });

  store.ready = true;
  console.log(
    `[Store] Loaded ${donors.length} donors, ${availableUnits.length} available units, ` +
      `${pendingRequests.length} pending requests into memory.`
  );
}

// ---------- Donor sync helpers ----------
function syncDonorInsert(donorDoc) {
  store.donorList.insertAtEnd(donorDoc);
  store.donorRankHeap.insert(donorDoc);
}
function syncDonorUpdate(donorDoc) {
  const id = String(donorDoc._id);
  store.donorList.update((d) => String(d._id) === id, donorDoc);
  store.donorRankHeap.removeWhere((d) => String(d._id) === id);
  store.donorRankHeap.insert(donorDoc);
}
function syncDonorDelete(donorId) {
  const id = String(donorId);
  store.donorList.remove((d) => String(d._id) === id);
  store.donorRankHeap.removeWhere((d) => String(d._id) === id);
}

// ---------- Inventory sync helpers ----------
function syncInventoryAdd(unitDoc) {
  if (unitDoc.status === "available") {
    store.inventoryByGroup.pushToBucketValue(unitDoc.bloodGroup, unitDoc);
    store.expiryHeap.insert(unitDoc);
  }
}
function syncInventoryRemove(unitDoc) {
  const id = String(unitDoc._id);
  const bucket = store.inventoryByGroup.get(unitDoc.bloodGroup) || [];
  store.inventoryByGroup.set(
    unitDoc.bloodGroup,
    bucket.filter((u) => String(u._id) !== id)
  );
  store.expiryHeap.removeWhere((u) => String(u._id) === id);
}
function syncInventoryStatusChange(unitDoc) {
  // Simplest correct approach: remove then (maybe) re-add
  syncInventoryRemove(unitDoc);
  if (unitDoc.status === "available") syncInventoryAdd(unitDoc);
}

// ---------- Request sync helpers ----------
function syncRequestAdd(requestDoc) {
  if (requestDoc.isEmergency) store.emergencyQueue.enqueue(requestDoc);
  else store.normalQueue.enqueue(requestDoc);
}
function syncRequestRemove(requestId) {
  const id = String(requestId);
  store.emergencyQueue.removeWhere((r) => String(r._id) === id);
  store.normalQueue.remove((r) => String(r._id) === id);
}

function getAvailableUnitCount(bloodGroup) {
  return (store.inventoryByGroup.get(bloodGroup) || []).length;
}

function getAllStockSnapshot() {
  const snapshot = {};
  BLOOD_GROUPS.forEach((g) => {
    snapshot[g] = getAvailableUnitCount(g);
  });
  return snapshot;
}

module.exports = {
  store,
  initStore,
  syncDonorInsert,
  syncDonorUpdate,
  syncDonorDelete,
  syncInventoryAdd,
  syncInventoryRemove,
  syncInventoryStatusChange,
  syncRequestAdd,
  syncRequestRemove,
  getAvailableUnitCount,
  getAllStockSnapshot,
};
