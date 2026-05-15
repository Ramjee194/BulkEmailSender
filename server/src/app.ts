// server/src/app.ts - REFACTORED FOR NODE.JS INTEGRATION
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { mkdir } from "fs/promises";
import { existsSync } from "fs";
import { config } from "dotenv";
import { serve } from "@hono/node-server";

// Import middleware
import { authMiddleware } from "./middleware/auth.js";

// Import routes
import indexRoutes from "./routes/index.js";
import authRoutes from "./routes/auth.js";
import sendRoutes from "./routes/send.js";
import reportRoutes from "./routes/report.js";
import configRoutes from "./routes/config.js";
import dashboardRoutes from "./routes/dashboard.js";

// Load environment variables
config();

const app = new Hono();

// Middleware
app.use("*", cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'], // SvelteKit dev ports
  credentials: true,
}));
app.use("*", logger());

// API Auth Middleware
app.use("*", async (c, next) => {
  const path = c.req.path;

  // Public API paths
  const publicPaths = [
    "/auth/login",
    "/auth/register",
    "/health"
  ];

  if (publicPaths.some((p) => path === p)) {
    return await next();
  }

  // Apply auth middleware for all other API routes
  return await authMiddleware(c, next);
});

// Initialize directories
async function initializeDirectories() {
  const dirs = ["./uploads", "./logs", "./data"];
  for (const dir of dirs) {
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }
  }
}

// API Routes
app.route("/", authRoutes);
app.route("/", indexRoutes);
app.route("/", sendRoutes);
app.route("/", reportRoutes);
app.route("/", configRoutes);
app.route("/", dashboardRoutes);

// Health check
app.get("/health", (c) => {
  return c.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    version: "3.0.0-node-api",
  });
});

// 404 handler (JSON only)
app.notFound((c) => {
  return c.json({ success: false, message: "Endpoint not found" }, 404);
});

// Error handler (JSON only)
app.onError((err, c) => {
  console.error("API Error:", err);
  
  const status = err.message.includes("Unauthorized") ? 401 : 500;
  
  return c.json(
    {
      success: false,
      message: err.message || "Internal Server Error",
    },
    status as any
  );
});

// Initialize and start server
const port = Number(process.env.PORT) || 3000;

console.log("🚀 Starting Bulk Email API Server (Node.js)...");
await initializeDirectories();

// Start the server using Node adapter
serve({
  fetch: app.fetch,
  port
});

console.log(`\n🌐 API Server running on port ${port}`);
console.log(`   🔗 Base URL: http://localhost:${port}`);

// Clean up expired sessions on startup
setTimeout(async () => {
  try {
    const { userDatabase } = await import("./services/userDatabase.js");
    userDatabase.cleanExpiredSessions();
    console.log("🧹 Cleaned expired sessions on startup");
  } catch (error) {
    console.error("Error cleaning expired sessions:", error);
  }
}, 1000);
