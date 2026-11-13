const express = require("express");
const apiRoutes = require("./routes");
const { errorHandler } = require("./middlewares/errorHandler");

const app = express();
const allowedOrigin = process.env.FRONTEND_URL || process.env.CORS_ORIGIN || "http://localhost:5173";

app.disable("x-powered-by");
app.use((req, res, next) => {
  const origin = req.get("origin");
  if (origin && origin !== allowedOrigin) {
    return res.status(403).json({ error: { code: "ORIGIN_NOT_ALLOWED", message: "Origine nepermisă." } });
  }
  if (origin) {
    res.set("Access-Control-Allow-Origin", origin);
    res.set("Vary", "Origin");
  }
  res.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.set("Access-Control-Allow-Headers", "Authorization,Content-Type");
  res.set("X-Content-Type-Options", "nosniff");
  res.set("X-Frame-Options", "DENY");
  res.set("Referrer-Policy", "no-referrer");
  if (req.method === "OPTIONS") return res.status(204).end();
  return next();
});
app.use(express.json({ limit: "64kb" }));
app.use("/api", apiRoutes);
app.use((req, res) => {
  res.status(404).json({ error: { code: "NOT_FOUND", message: "Ruta nu a fost găsită." } });
});
app.use(errorHandler);

module.exports = app;