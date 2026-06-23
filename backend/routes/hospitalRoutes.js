const express = require("express");
const protect = require("../middleware/auth");
const allowRoles = require("../middleware/role");
const ctrl = require("../controllers/hospitalController");

const router = express.Router();

router.use(protect);

router.post("/", allowRoles("admin"), ctrl.createHospital);
router.get("/", allowRoles("admin", "hospital"), ctrl.listHospitals);
router.get("/:id", allowRoles("admin", "hospital"), ctrl.getHospital);
router.put("/:id", allowRoles("admin"), ctrl.updateHospital);
router.delete("/:id", allowRoles("admin"), ctrl.deleteHospital);

module.exports = router;
