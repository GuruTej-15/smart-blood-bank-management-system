const Request = require("../models/Request");
const { store, syncRequestAdd, syncRequestRemove, getAvailableUnitCount } = require("../utils/store");
const { consumeUnits } = require("../utils/fulfillment");

async function createRequest(req, res) {
  const body = { ...req.body, isEmergency: false, priority: req.body.priority || "normal" };
  if (req.user.role === "hospital" && req.user.hospital) {
    body.hospital = req.user.hospital;
  }
  if (!body.hospital) {
    return res.status(400).json({ message: "hospital is required" });
  }
  const request = await Request.create(body);
  syncRequestAdd(request.toObject());
  res.status(201).json(request);
}

async function listRequests(req, res) {
  const { status } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (req.user.role === "hospital" && req.user.hospital) {
    filter.hospital = req.user.hospital;
  }
  const requests = await Request.find(filter).populate("hospital", "hospitalName").sort({ createdAt: -1 });
  res.json({ count: requests.length, requests });
}

async function getRequest(req, res) {
  const request = await Request.findById(req.params.id).populate("hospital", "hospitalName");
  if (!request) return res.status(404).json({ message: "Request not found" });
  res.json(request);
}

/** Live FIFO view of pending normal requests, straight from the Queue */
async function queueView(req, res) {
  res.json({ size: store.normalQueue.size, queue: store.normalQueue.toArray() });
}

async function rejectRequest(req, res) {
  const request = await Request.findByIdAndUpdate(
    req.params.id,
    { status: "rejected", decidedAt: new Date(), notes: req.body.notes || "" },
    { new: true }
  );
  if (!request) return res.status(404).json({ message: "Request not found" });
  syncRequestRemove(request._id);
  res.json(request);
}

async function fulfillRequestFromStock(request, unitsToConsume) {
  const { fulfilledUnits, shortfall, consumedBatches } = await consumeUnits(
    request.bloodGroup,
    unitsToConsume
  );

  request.fulfilledUnitsCount = (request.fulfilledUnitsCount || 0) + fulfilledUnits;
  request.fulfilledUnits = [
    ...((request.fulfilledUnits && Array.isArray(request.fulfilledUnits)) ? request.fulfilledUnits : []),
    ...consumedBatches.map((b) => b.batchId),
  ];
  request.status = shortfall === 0 ? "fulfilled" : "approved";
  request.decidedAt = new Date();
  await request.save();

  if (request.status !== "pending") {
    syncRequestRemove(request._id);
  }

  return { request, fulfilledUnits, shortfall };
}

/** Approve and attempt to fulfill from current stock immediately */
async function approveAndFulfill(req, res) {
  const request = await Request.findById(req.params.id);
  if (!request) return res.status(404).json({ message: "Request not found" });
  if (request.status !== "pending") {
    return res.status(400).json({ message: `Request already ${request.status}` });
  }

  const unitsRemaining = request.unitsRequired - (request.fulfilledUnitsCount || 0);
  const { fulfilledUnits, shortfall } = await fulfillRequestFromStock(request, unitsRemaining);

  res.json({
    request,
    fulfilledUnits,
    shortfall,
    availableNow: getAvailableUnitCount(request.bloodGroup),
  });
}

async function fulfillApprovedRequest(req, res) {
  const request = await Request.findById(req.params.id);
  if (!request) return res.status(404).json({ message: "Request not found" });
  if (request.status !== "approved") {
    return res.status(400).json({ message: `Request must be approved to retry fulfillment` });
  }

  const unitsRemaining = request.unitsRequired - (request.fulfilledUnitsCount || 0);
  if (unitsRemaining <= 0) {
    request.status = "fulfilled";
    request.decidedAt = new Date();
    await request.save();
    syncRequestRemove(request._id);
    return res.json({ request, fulfilledUnits: 0, shortfall: 0, availableNow: getAvailableUnitCount(request.bloodGroup) });
  }

  const { fulfilledUnits, shortfall } = await fulfillRequestFromStock(request, unitsRemaining);
  res.json({ request, fulfilledUnits, shortfall, availableNow: getAvailableUnitCount(request.bloodGroup) });
}

/** Pop the oldest pending normal request and attempt to fulfill it (FCFS) */
async function processNext(req, res) {
  const next = store.normalQueue.peek();
  if (!next) return res.status(200).json({ message: "Normal request queue is empty" });

  const request = await Request.findById(next._id);
  if (!request || request.status !== "pending") {
    store.normalQueue.dequeue();
    return res.status(200).json({ message: "Stale entry skipped, call again to process the next one" });
  }

  const unitsRemaining = request.unitsRequired - (request.fulfilledUnitsCount || 0);
  const { fulfilledUnits, shortfall } = await fulfillRequestFromStock(request, unitsRemaining);

  store.normalQueue.dequeue();

  res.json({ request, fulfilledUnits, shortfall });
}

module.exports = {
  createRequest,
  listRequests,
  getRequest,
  queueView,
  rejectRequest,
  approveAndFulfill,
  fulfillApprovedRequest,
  processNext,
};
