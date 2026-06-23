const express = require("express");
const protect = require("../middleware/auth");
const allowRoles = require("../middleware/role");
const ctrl = require("../controllers/inventoryController");

const router = express.Router();

router.use(protect);

router.get("/snapshot", allowRoles("admin", "hospital"), ctrl.stockSnapshot);
router.get("/expiring", allowRoles("admin", "hospital"), ctrl.expiringSoon);
router.get("/expired", allowRoles("admin", "hospital"), ctrl.expiredUnits);
router.post("/sweep-expired", allowRoles("admin"), ctrl.sweepExpired);
router.get("/group/:bloodGroup", allowRoles("admin", "hospital"), ctrl.stockByGroup);

router.post("/", allowRoles("admin"), ctrl.addBatch);
router.get("/", allowRoles("admin", "hospital"), ctrl.listBatches);
router.put("/:id", allowRoles("admin"), ctrl.updateBatch);
router.delete("/:id", allowRoles("admin"), ctrl.deleteBatch);

module.exports = router;
