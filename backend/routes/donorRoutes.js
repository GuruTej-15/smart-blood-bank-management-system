const express = require("express");
const protect = require("../middleware/auth");
const allowRoles = require("../middleware/role");
const ctrl = require("../controllers/donorController");

const router = express.Router();

router.use(protect);

router.get("/me", allowRoles("donor"), ctrl.myProfile);
router.get("/leaderboard", ctrl.leaderboard);
router.get("/search", allowRoles("admin", "hospital"), ctrl.searchDonors);
router.get("/smart-finder", allowRoles("admin", "hospital"), ctrl.smartFinder);
router.get("/:id/eligibility", allowRoles("admin", "hospital"), ctrl.eligibilityCheck);
router.get("/:id/reward", allowRoles("admin", "hospital"), ctrl.rewardInfo);
router.get("/:id/card", allowRoles("admin", "hospital"), ctrl.donorCard);

router.post("/", allowRoles("admin", "hospital"), ctrl.createDonor);
router.get("/", allowRoles("admin", "hospital"), ctrl.listDonors);
router.get("/:id", allowRoles("admin", "hospital"), ctrl.getDonor);
router.put("/:id", allowRoles("admin"), ctrl.updateDonor);
router.delete("/:id", allowRoles("admin"), ctrl.deleteDonor);

module.exports = router;
