const express = require("express");
const protect = require("../middleware/auth");
const allowRoles = require("../middleware/role");
const ctrl = require("../controllers/donationController");

const router = express.Router();

router.use(protect);

router.post("/", allowRoles("admin", "hospital"), ctrl.recordDonation);
router.get("/", allowRoles("admin", "hospital"), ctrl.listDonations);

module.exports = router;
