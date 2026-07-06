const Request = require("../models/Request");
const { store, syncRequestAdd, syncRequestRemove } = require("../utils/store");
const { consumeUnits } = require("../utils/fulfillment");
const { triggerBroadcast } = require("../utils/broadcastService");

async function createEmergencyRequest(req, res) {
  const body = {
    ...req.body,
    isEmergency: true,
    priority: ["critical", "high"].includes(req.body.priority) ? req.body.priority : "critical",
  };
  if (req.user.role === "hospital" && req.user.hospital && !req.body.hospital) {
    body.hospital = req.user.hospital;
  }
  if (!body.hospital) {
    return res.status(400).json({ message: "hospital is required" });
  }
  const request = await Request.create(body);
  syncRequestAdd(request.toObject());
  res.status(201).json(request);
}

/** Live, most-urgent-first view of the emergency Priority Queue */
const Hospital = require("../models/Hospital");

async function queueView(req, res) {
  const queueArr = store.emergencyQueue.toSortedArray();
  const hospitalIds = Array.from(new Set(queueArr.map((q) => String(q.hospital)).filter(Boolean)));
  let hospitals = [];
  if (hospitalIds.length) {
    hospitals = await Hospital.find({ _id: { $in: hospitalIds } }).lean();
  }
  const hospMap = hospitals.reduce((acc, h) => ({ ...acc, [String(h._id)]: h.hospitalName }), {});
  const enriched = queueArr.map((q) => ({ ...q, hospitalName: hospMap[String(q.hospital)] || null }));
  res.json({ size: store.emergencyQueue.size, queue: enriched });
}

/**
 * Pops the single most urgent pending emergency request and attempts to
 * fulfill it immediately. If stock falls short, triggers the Emergency
 * Broadcast System for that blood group.
 */
async function processNext(req, res) {
  const next = store.emergencyQueue.peek();
  if (!next) return res.status(200).json({ message: "Emergency queue is empty" });

  const request = await Request.findById(next._id);
  if (!request || request.status !== "pending") {
    store.emergencyQueue.dequeue();
    return res.status(200).json({ message: "Stale entry skipped, call again to process the next one" });
  }

  const { fulfilledUnits, shortfall, consumedBatches } = await consumeUnits(
    request.bloodGroup,
    request.unitsRequired
  );
  request.status = shortfall === 0 ? "fulfilled" : "approved";
  request.decidedAt = new Date();
  request.fulfilledUnitsCount = (request.fulfilledUnitsCount || 0) + fulfilledUnits;
  request.fulfilledUnits = [
    ...((request.fulfilledUnits && Array.isArray(request.fulfilledUnits)) ? request.fulfilledUnits : []),
    ...consumedBatches.map((b) => b.batchId),
  ];
  await request.save();

  // remove from in-memory queue and sync state
  store.emergencyQueue.dequeue();
  if (request.status !== "pending") {
    syncRequestRemove(request._id);
  }

  let broadcast = null;
  if (shortfall > 0) {
    broadcast = await triggerBroadcast(request.bloodGroup, "emergency_request", request._id);
  }

  res.json({ request, fulfilledUnits, shortfall, broadcastTriggered: !!broadcast, broadcast });
}

module.exports = { createEmergencyRequest, queueView, processNext };
