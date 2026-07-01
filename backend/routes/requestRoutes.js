const express = require("express");
const protect = require("../middleware/auth");
const allowRoles = require("../middleware/role");
const ctrl = require("../controllers/requestController");

const router = express.Router();

router.use(protect);

router.get("/queue", allowRoles("admin"), ctrl.queueView);
router.post("/process-next", allowRoles("admin"), ctrl.processNext);

router.post("/", allowRoles("admin", "hospital"), ctrl.createRequest);
router.get("/", allowRoles("admin", "hospital"), ctrl.listRequests);
router.get("/:id", allowRoles("admin", "hospital"), ctrl.getRequest);
router.post("/:id/approve", allowRoles("admin"), ctrl.approveAndFulfill);
router.post("/:id/reject", allowRoles("admin"), ctrl.rejectRequest);

module.exports = router;
