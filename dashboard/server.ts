import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = parseInt(process.env.PORT || "3000", 10);
const PYTHON_BACKEND = process.env.PYTHON_BACKEND || "http://localhost:8080";

app.get("/api/results", async (_req, res) => {
  try {
    const response = await fetch(`${PYTHON_BACKEND}/api/results`);
    if (response.ok) return res.json(await response.json());
  } catch (_) {}
  res.status(503).json({ error: "Python backend unavailable" });
});

app.get("/api/stats", async (_req, res) => {
  try {
    const response = await fetch(`${PYTHON_BACKEND}/api/stats`);
    if (response.ok) return res.json(await response.json());
  } catch (_) {}
  res.status(503).json({ error: "Python backend unavailable" });
});

app.get("/api/backend-status", async (_req, res) => {
  try {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 500);
    const response = await fetch(`${PYTHON_BACKEND}/api/stats`, { signal: controller.signal });
    if (response.ok) return res.json({ connected: true });
  } catch (_) {}
  res.json({ connected: false });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => res.sendFile(path.join(distPath, "index.html")));
  }
  app.listen(PORT, "0.0.0.0", () => console.log(`Server: http://localhost:${PORT}`));
}

startServer();