// src/routes/dashboard.ts - UPDATED FOR NODE.JS ESM
import { Hono } from "hono";
import { requireAuth } from "../middleware/auth.js";

// Simple in-memory cache for dashboard state
let dashboardState = {
  lastBatchCheck: 0,
  lastScheduledCheck: 0,
  hasBatchJobs: false,
  hasScheduledJobs: false,
  cacheValidFor: 5000, // Cache valid for 5 seconds
};

const app = new Hono();

// NEW: Lightweight endpoint to check if polling is needed
app.get("/dashboard/poll-status", async (c) => {
  const user = requireAuth(c);

  try {
    const now = Date.now();
    let hasActiveBatch = false;
    let hasScheduledJobs = false;
    let hasRunningScheduledJobs = false;

    // Use cached values if recent enough
    if (now - dashboardState.lastBatchCheck < dashboardState.cacheValidFor) {
      hasActiveBatch = dashboardState.hasBatchJobs;
    } else {
      // Check batch status (only import when needed)
      try {
        const { batchService } = await import("../services/batchService.js");
        const batchStatus = batchService.getBatchStatus();
        hasActiveBatch = batchStatus.isRunning;
        dashboardState.hasBatchJobs = hasActiveBatch;
        dashboardState.lastBatchCheck = now;
      } catch (error: any) {
        console.warn("Batch service not available:", error.message);
        hasActiveBatch = false;
      }
    }

    // Use cached values if recent enough
    if (
      now - dashboardState.lastScheduledCheck <
      dashboardState.cacheValidFor
    ) {
      hasScheduledJobs = dashboardState.hasScheduledJobs;
    } else {
      // Check scheduled jobs (only import when needed)
      try {
        const { schedulerService } = await import("../services/schedulerService.js");
        const scheduledJobs = schedulerService.getScheduledJobs();
        hasScheduledJobs = scheduledJobs && scheduledJobs.length > 0;
        hasRunningScheduledJobs =
          scheduledJobs &&
          scheduledJobs.some((job: any) => job.status === "running");
        dashboardState.hasScheduledJobs = hasScheduledJobs;
        dashboardState.lastScheduledCheck = now;
      } catch (error: any) {
        console.warn("Scheduler service not available:", error.message);
        hasScheduledJobs = false;
      }
    }

    // Determine if polling is needed and at what interval
    let pollNeeded = false;
    let pollInterval = 30000; // Default 30 seconds (slow polling)

    if (hasActiveBatch) {
      pollNeeded = true;
      pollInterval = 3000; // Fast polling for active batch jobs (3 seconds)
    } else if (hasRunningScheduledJobs) {
      pollNeeded = true;
      pollInterval = 10000; // Medium polling for running scheduled jobs (10 seconds)
    } else if (hasScheduledJobs) {
      pollNeeded = true;
      pollInterval = 30000; // Slow polling for pending scheduled jobs (30 seconds)
    }

    return c.json({
      success: true,
      data: {
        pollNeeded,
        pollInterval,
        hasActiveBatch,
        hasScheduledJobs,
        hasRunningScheduledJobs,
        activeBatchCount: hasActiveBatch ? 1 : 0,
        scheduledJobCount: hasScheduledJobs ? 1 : 0, // Simplified count
        lastUpdated: new Date().toISOString(),
        cached: true,
      },
    });
  } catch (error) {
    console.error("Poll status error:", error);
    return c.json({
      success: true,
      data: {
        pollNeeded: false,
        pollInterval: 30000,
        hasActiveBatch: false,
        hasScheduledJobs: false,
        hasRunningScheduledJobs: false,
        activeBatchCount: 0,
        scheduledJobCount: 0,
        lastUpdated: new Date().toISOString(),
        error: "Service unavailable",
      },
    });
  }
});

// NEW: Optimized dashboard data endpoint (only called when needed)
app.get("/dashboard/data", async (c) => {
  const user = requireAuth(c);

  try {
    let batchStatus = null;
    let scheduledJobs = null;

    // Only fetch batch data if we know there are active jobs
    if (dashboardState.hasBatchJobs) {
      try {
        const { batchService } = await import("../services/batchService.js");
        batchStatus = batchService.getBatchStatus();
      } catch (error: any) {
        console.warn("Batch service unavailable:", error.message);
      }
    }

    // Only fetch scheduled jobs if we know there any
    if (dashboardState.hasScheduledJobs) {
      try {
        const { schedulerService } = await import("../services/schedulerService.js");
        const allJobs = schedulerService.getScheduledJobs();
        // Filter to only return relevant ones and limit to 5
        scheduledJobs = allJobs
          .filter(
            (job: any) => job.status === "scheduled" || job.status === "running"
          )
          .slice(0, 5);
      } catch (error: any) {
        console.warn("Scheduler service unavailable:", error.message);
      }
    }

    return c.json({
      success: true,
      data: {
        batch: batchStatus,
        scheduledJobs: scheduledJobs || [],
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Dashboard data error:", error);
    return c.json(
      {
        success: false,
        message: "Failed to fetch dashboard data",
        data: {
          batch: null,
          scheduledJobs: [],
          timestamp: new Date().toISOString(),
        },
      },
      500
    );
  }
});

export default app;
