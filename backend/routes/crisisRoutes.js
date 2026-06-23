const express = require("express");
const protect = require("../middleware/auth");
const ctrl = require("../controllers/crisisController");

const router = express.Router();

router.use(protect);
router.get("/predict", ctrl.predict);

module.exports = router;
