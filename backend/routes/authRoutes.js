const express = require("express");
const {
	register,
	login,
	me,
	forgotPasswordRequest,
	resetPasswordWithOtp,
	googleAuth,
	createAdminInvite,
	listAdminInvites,
	revokeAdminInvite,
} = require("../controllers/authController");
const protect = require("../middleware/auth");
const allowRoles = require("../middleware/role");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/google", googleAuth);
router.post("/forgot-password/request", forgotPasswordRequest);
router.post("/forgot-password/reset", resetPasswordWithOtp);
router.get("/me", protect, me);
router.post("/admin-invites", protect, allowRoles("admin"), createAdminInvite);
router.get("/admin-invites", protect, allowRoles("admin"), listAdminInvites);
router.post("/admin-invites/:id/revoke", protect, allowRoles("admin"), revokeAdminInvite);

module.exports = router;
