import express from "express";
import http from "http";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import path from "path";
import fs from "fs";

import config from "./config";
import connectDB from "./config/db";
import { setupSocket } from "./socket";
import { errorHandler } from "./middleware/errorHandler";

// Route imports
import authRoutes from "./routes/authRoutes";
import orgRoutes from "./routes/orgRoutes";
import incidentRoutes from "./routes/incidentRoutes";
import dashboardRoutes from "./routes/dashboardRoutes";
import activityRoutes from "./routes/activityRoutes";

const app = express();
const server = http.createServer(app);

// Setup Socket.IO
const io = setupSocket(server);
app.set("io", io); // Make io accessible in controllers via req.app.get("io")

// ============ Security Middleware ============
app.use(helmet()); // Security headers
app.use(mongoSanitize()); // Prevent NoSQL injection

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // max 100 requests per windowMs
  message: { success: false, message: "Too many requests. Please try again later." },
});
app.use("/api/", limiter);

// Stricter rate limit for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: "Too many auth attempts. Try again later." },
});
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/signup", authLimiter);

// ============ General Middleware ============
app.use(cors({ origin: config.clientUrl, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use("/uploads", express.static(uploadsDir));

// ============ API Routes ============
app.use("/api/auth", authRoutes);
app.use("/api/orgs", orgRoutes);
app.use("/api/incidents", incidentRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/activities", activityRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "Server is running", timestamp: new Date().toISOString() });
});

// ============ Error Handling ============
app.use(errorHandler);

// ============ Start Server ============
const startServer = async () => {
  await connectDB();

  server.listen(config.port, () => {
    console.log(`🚀 Server running on port ${config.port}`);
    console.log(`📡 Environment: ${config.nodeEnv}`);
  });
};

startServer();

export default app;
