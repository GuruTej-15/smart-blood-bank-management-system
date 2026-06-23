const express = require("express");
const protect = require("../middleware/auth");
const ctrl = require("../controllers/compatibilityController");

const router = express.Router();

router.use(protect);
router.get("/chart", ctrl.fullChart);
router.get("/:bloodGroup", ctrl.checkCompatibility);

module.exports = router;
