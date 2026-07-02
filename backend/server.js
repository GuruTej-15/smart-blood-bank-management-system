require("dotenv").config();
const http = require("http");
const app = require("./app");
const connectDB = require("./config/db");
const { initStore } = require("./utils/store");

const PORT = process.env.PORT || 5000;

const requiredEnv = [
  "JWT_SECRET",
  "MONGO_URI",
  "CORS_ORIGIN",
  "FRONTEND_URL",
];

const missingEnv = requiredEnv.filter((key) => !process.env[key] || !String(process.env[key]).trim());
if (missingEnv.length) {
  const message = `Missing required environment variables: ${missingEnv.join(", ")}`;
  if (process.env.NODE_ENV === "production") {
    throw new Error(message);
  }
  console.warn(`[Server] ${message} - using the app in development mode only is strongly discouraged`);
}

if (!process.env.JWT_SECRET) {
  const message = "JWT_SECRET is required";
  if (process.env.NODE_ENV === "production") {
    throw new Error(message);
  }
  console.warn(`[Server] ${message} - using the app in development mode only is strongly discouraged`);
}

async function start() {
  await connectDB();
  await initStore();

  const server = http.createServer(app);

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(`[Server] Port ${PORT} is already in use. Stop the existing process or change PORT in backend/.env.`);
      process.exit(1);
    }
    throw err;
  });

  server.listen(PORT, () => {
    console.log(`[Server] Smart Blood Bank API running on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error("[Server] Failed to start:", err);
  process.exit(1);
});
