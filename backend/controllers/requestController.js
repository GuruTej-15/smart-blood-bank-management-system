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

/** Approve and attempt to fulfill from current stock immediately */
async function approveAndFulfill(req, res) {
  const request = await Request.findById(req.params.id);
  if (!request) return res.status(404).json({ message: "Request not found" });
  if (request.status !== "pending") {
    return res.status(400).json({ message: `Request already ${request.status}` });
  }

  const { fulfilledUnits, shortfall, consumedBatches } = await consumeUnits(
    request.bloodGroup,
    request.unitsRequired
  );

  request.status = shortfall === 0 ? "fulfilled" : "approved"; // approved-but-partial stays open
  request.decidedAt = new Date();
  request.fulfilledUnits = consumedBatches.map((b) => b.batchId);
  await request.save();

  if (request.status === "fulfilled") {
    syncRequestRemove(request._id);
  }

  res.json({
    request,
    fulfilledUnits,
    shortfall,
    availableNow: getAvailableUnitCount(request.bloodGroup),
  });
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

  const { fulfilledUnits, shortfall, consumedBatches } = await consumeUnits(
    request.bloodGroup,
    request.unitsRequired
  );
  request.status = shortfall === 0 ? "fulfilled" : "approved";
  request.decidedAt = new Date();
  request.fulfilledUnits = consumedBatches.map((b) => b.batchId);
  await request.save();

  store.normalQueue.dequeue();
  if (request.status === "approved") {
    // still short on stock - keep it tracked, but don't re-enqueue at the back automatically
  }

  res.json({ request, fulfilledUnits, shortfall });
}

module.exports = {
  createRequest,
  listRequests,
  getRequest,
  queueView,
  rejectRequest,
  approveAndFulfill,
  processNext,
};
