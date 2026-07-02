const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const sanitizeRequest = require("./middleware/sanitize");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const authRoutes = require("./routes/authRoutes");
const donorRoutes = require("./routes/donorRoutes");
const inventoryRoutes = require("./routes/inventoryRoutes");
const requestRoutes = require("./routes/requestRoutes");
const emergencyRoutes = require("./routes/emergencyRoutes");
const hospitalRoutes = require("./routes/hospitalRoutes");
const donationRoutes = require("./routes/donationRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const crisisRoutes = require("./routes/crisisRoutes");
const compatibilityRoutes = require("./routes/compatibilityRoutes");
const broadcastRoutes = require("./routes/broadcastRoutes");

const app = express();

app.set("trust proxy", 1);

const allowedOrigins = String(process.env.CORS_ORIGIN || "")
	.split(",")
	.map((origin) => origin.trim())
	.filter(Boolean);

const corsOptions = {
	origin(origin, callback) {
		if (!origin) {
			// Allow non-browser or same-service requests without an Origin header.
			return callback(null, true);
		}
		if (allowedOrigins.includes(origin)) {
			return callback(null, true);
		}
		return callback(new Error(`CORS blocked for origin ${origin}`));
	},
	credentials: true,
};

const apiLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: Number(process.env.API_RATE_LIMIT) || 300,
	standardHeaders: true,
	legacyHeaders: false,
});

const authLimiter = rateLimit({
	windowMs: 15 * 60 * 60 * 1000,
	max: Number(process.env.AUTH_RATE_LIMIT) || 20,
	standardHeaders: true,
	legacyHeaders: false,
});

app.disable("x-powered-by");
app.use(
	helmet({
		contentSecurityPolicy: false,
		crossOriginEmbedderPolicy: false,
	})
);
app.use(helmet.referrerPolicy({ policy: "no-referrer" }));
app.use(helmet.permittedCrossDomainPolicies());
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());
app.use(cors(corsOptions));
app.use(express.json({ limit: "1mb" }));
app.use(sanitizeRequest);
app.use("/api/auth", authLimiter);
app.use("/api", apiLimiter);
if (process.env.NODE_ENV !== "test") app.use(morgan("dev"));

app.get("/api/health", (req, res) => res.json({ status: "ok", time: new Date().toISOString() }));

app.use("/api/auth", authRoutes);
app.use("/api/donors", donorRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/emergency", emergencyRoutes);
app.use("/api/hospitals", hospitalRoutes);
app.use("/api/donations", donationRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/crisis", crisisRoutes);
app.use("/api/compatibility", compatibilityRoutes);
app.use("/api/broadcast", broadcastRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
