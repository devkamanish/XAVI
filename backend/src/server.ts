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


import authRoutes from "./routes/authRoutes";
import orgRoutes from "./routes/orgRoutes";
import incidentRoutes from "./routes/incidentRoutes";
import dashboardRoutes from "./routes/dashboardRoutes";
import activityRoutes from "./routes/activityRoutes";

const app = express();
const server = http.createServer(app);


const io = setupSocket(server);
app.set("io", io); 


app.use(helmet()); 
app.use(mongoSanitize()); 


const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  message: { success: false, message: "Too many requests. Please try again later." },
});
app.use("/api/", limiter);


const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: "Too many auth attempts. Try again later." },
});
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/signup", authLimiter);


app.use(cors({ origin: config.clientUrl, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));


const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use("/uploads", express.static(uploadsDir));


app.use("/api/auth", authRoutes);
app.use("/api/orgs", orgRoutes);
app.use("/api/incidents", incidentRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/activities", activityRoutes);


const frontendDistDir = path.join(__dirname, "..", "..", "frontend", "dist");
if (fs.existsSync(frontendDistDir)) {
  app.use(express.static(frontendDistDir));
}

app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "Server is running", timestamp: new Date().toISOString() });
});

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) {
    return next();
  }
  if (fs.existsSync(frontendDistDir)) {
    return res.sendFile(path.join(frontendDistDir, "index.html"));
  }
  res.json({ success: true, message: "Welcome to XAVI API. API endpoints are at /api, health check at /api/health." });
});


app.use(errorHandler);


const startServer = async () => {
  await connectDB();

  server.listen(config.port, () => {
    console.log(`🚀 Server running on port ${config.port}`);
    console.log(`📡 Environment: ${config.nodeEnv}`);
  });
};

startServer();

export default app;
