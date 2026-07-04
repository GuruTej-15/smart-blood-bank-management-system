const express = require("express");
const rateLimit = require("express-rate-limit");
const { requireFields } = require("../middleware/validate");
const {
	register,
	login,
	logout,
	me,
	forgotPasswordRequest,
	verifyResetOtp,
	resetPasswordWithOtp,
	verifyEmail,
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

const forgotPasswordLimiter = rateLimit({
	windowMs: 60 * 60 * 1000,
	max: Number(process.env.PASSWORD_RESET_REQUEST_LIMIT) || 3,
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

router.post("/register", requireFields(["name", "email", "password", "role"]), register);
router.post("/login", loginLimiter, requireFields(["email", "password"]), login);
router.post("/logout", protect, logout);
router.post("/forgot-password", forgotPasswordLimiter, requireFields(["email"]), forgotPasswordRequest);
router.post("/verify-reset-otp", verifyOtpLimiter, requireFields(["email", "otp"]), verifyResetOtp);
router.post("/reset-password", resetPasswordLimiter, requireFields(["email", "resetToken", "newPassword", "confirmPassword"]), resetPasswordWithOtp);
router.post("/verify-email", requireFields(["email", "token"]), verifyEmail);
router.post("/forgot-password/request", forgotPasswordLimiter, requireFields(["email"]), forgotPasswordRequest);
router.post("/forgot-password/reset", resetPasswordLimiter, requireFields(["email", "resetToken", "newPassword", "confirmPassword"]), resetPasswordWithOtp);
// Protected debug route to test SMTP from deployed backend. Requires header 'x-debug-token' matching DEBUG_SMTP_TOKEN env var.
router.post("/_debug/smtp-test", requireFields(["email"]), async (req, res) => {
	try {
		const token = req.get("x-debug-token") || "";
		if (!process.env.DEBUG_SMTP_TOKEN || token !== process.env.DEBUG_SMTP_TOKEN) {
			return res.status(403).json({ message: "Forbidden" });
		}
		const { email } = req.body;
		const { sendMail } = require("../utils/email");
		await sendMail({ to: email, subject: "Smart Blood Bank — SMTP debug", text: "SMTP debug message", html: "<p>SMTP debug message</p>" });
		return res.json({ message: `Test email sent to ${email}` });
	} catch (err) {
		console.error('[Debug SMTP] sendMail error:', err && err.stack ? err.stack : err);
		return res.status(500).json({ message: 'SMTP test failed', error: err && err.message ? err.message : String(err) });
	}
});
router.get("/me", protect, me);
router.post("/admin-invites", protect, allowRoles("admin"), createAdminInvite);
router.get("/admin-invites", protect, allowRoles("admin"), listAdminInvites);
router.post("/admin-invites/:id/revoke", protect, allowRoles("admin"), revokeAdminInvite);

module.exports = router;
