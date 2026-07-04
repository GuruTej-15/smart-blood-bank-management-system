const express = require("express");
const rateLimit = require("express-rate-limit");
const { requireFields } = require("../middleware/validate");
const {
	register,
	login,
	logout,
	me,
	createAdminInvite,
	listAdminInvites,
	revokeAdminInvite,
} = require("../controllers/authController");
const protect = require("../middleware/auth");
const allowRoles = require("../middleware/role");

const router = express.Router();

const loginLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: Number(process.env.AUTH_RATE_LIMIT) || 20,
	standardHeaders: true,
	legacyHeaders: false,
	message: { message: "Too many login attempts. Please try again later." },
});


router.post("/register", requireFields(["name", "email", "password", "role"]), register);
router.post("/login", loginLimiter, requireFields(["email", "password"]), login);
router.post("/logout", protect, logout);
router.get("/me", protect, me);
router.post("/admin-invites", protect, allowRoles("admin"), createAdminInvite);
router.get("/admin-invites", protect, allowRoles("admin"), listAdminInvites);
router.post("/admin-invites/:id/revoke", protect, allowRoles("admin"), revokeAdminInvite);

module.exports = router;
