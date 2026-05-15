import { Hono } from "hono";

const app = new Hono();

// Redirect root to dashboard (if called directly, though the main app.ts handles most logic)
app.get("/", (c) => {
  return c.redirect("/dashboard");
});

export default app;
