const express = require("express");
const protect = require("../middleware/auth");
const allowRoles = require("../middleware/role");
const ctrl = require("../controllers/analyticsController");

const router = express.Router();

router.use(protect);

router.get("/dashboard", allowRoles("admin", "hospital"), ctrl.dashboardSummary);
router.get("/most-demanded", allowRoles("admin", "hospital"), ctrl.mostDemanded);
router.get("/monthly-donations", allowRoles("admin", "hospital"), ctrl.monthlyDonations);
router.get("/monthly-requests", allowRoles("admin", "hospital"), ctrl.monthlyRequests);
router.get("/stock-trend", allowRoles("admin", "hospital"), ctrl.stockTrend);
router.get("/demand-insights", allowRoles("admin", "hospital"), ctrl.demandInsights);

module.exports = router;
