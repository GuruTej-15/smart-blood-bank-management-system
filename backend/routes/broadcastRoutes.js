const express = require("express");
const protect = require("../middleware/auth");
const allowRoles = require("../middleware/role");
const ctrl = require("../controllers/broadcastController");

const router = express.Router();

router.use(protect);

router.post("/trigger", allowRoles("admin"), ctrl.manualTrigger);
router.post("/auto-check", allowRoles("admin"), ctrl.autoCheckLowStock);
router.get("/history", allowRoles("admin", "hospital"), ctrl.history);

module.exports = router;
