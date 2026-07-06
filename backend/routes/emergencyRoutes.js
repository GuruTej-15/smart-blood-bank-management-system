const express = require("express");
const protect = require("../middleware/auth");
const allowRoles = require("../middleware/role");
const ctrl = require("../controllers/emergencyController");

const router = express.Router();

router.use(protect);

router.get("/queue", allowRoles("admin", "hospital"), ctrl.queueView);
router.post("/process-next", allowRoles("admin"), ctrl.processNext);
router.post("/", allowRoles("hospital"), ctrl.createEmergencyRequest);

module.exports = router;
