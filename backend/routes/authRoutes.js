const express = require("express");
const rateLimit = require("express-rate-limit");
const {
	register,
	login,
	me,
	forgotPasswordRequest,
	verifyResetOtp,
	resetPasswordWithOtp,
	googleAuth,
	createAdminInvite,
	listAdminInvites,
	revokeAdminInvite,
} = require("../controllers/authController");
const protect = require("../middleware/auth");
const allowRoles = require("../middleware/role");

const router = express.Router();

const forgotPasswordLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: Number(process.env.PASSWORD_RESET_REQUEST_LIMIT) || 5,
	standardHeaders: true,
	legacyHeaders: false,
	message: { message: "Too many password reset requests. Please try again later." },
});

const verifyOtpLimiter = rateLimit({
	windowMs: 10 * 60 * 1000,
	max: Number(process.env.PASSWORD_RESET_VERIFY_LIMIT) || 10,
	standardHeaders: true,
	legacyHeaders: false,
	message: { message: "Too many verification attempts. Please try again later." },
});

const resetPasswordLimiter = rateLimit({
	windowMs: 10 * 60 * 1000,
	max: Number(process.env.PASSWORD_RESET_SUBMIT_LIMIT) || 5,
	standardHeaders: true,
	legacyHeaders: false,
	message: { message: "Too many reset attempts. Please try again later." },
});

router.post("/register", register);
router.post("/login", login);
router.post("/google", googleAuth);
router.post("/forgot-password", forgotPasswordLimiter, forgotPasswordRequest);
router.post("/verify-reset-otp", verifyOtpLimiter, verifyResetOtp);
router.post("/reset-password", resetPasswordLimiter, resetPasswordWithOtp);
router.post("/forgot-password/request", forgotPasswordLimiter, forgotPasswordRequest);
router.post("/forgot-password/reset", resetPasswordLimiter, resetPasswordWithOtp);
router.get("/me", protect, me);
router.post("/admin-invites", protect, allowRoles("admin"), createAdminInvite);
router.get("/admin-invites", protect, allowRoles("admin"), listAdminInvites);
router.post("/admin-invites/:id/revoke", protect, allowRoles("admin"), revokeAdminInvite);

module.exports = router;
