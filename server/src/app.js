
const express = require("express");
const path = require("node:path");
const apiRoutes = require("./routes");
const { errorHandler } = require("./middlewares/errorHandler");

const app = express();
const allowedOrigin = process.env.FRONTEND_URL || process.env.CORS_ORIGIN || "http://localhost:5173";
const trustedProxies = (process.env.TRUSTED_PROXIES || "")
  .split(",")
  .map((proxy) => proxy.trim())
  .filter(Boolean);

if (trustedProxies.some((proxy) => ["*", "0.0.0.0/0", "::/0"].includes(proxy))) {
  throw new Error("TRUSTED_PROXIES must list specific trusted proxy addresses or subnets.");
}
const trustedProxyHops = process.env.TRUST_PROXY_HOPS === undefined ? 0 : Number(process.env.TRUST_PROXY_HOPS);
if (!Number.isInteger(trustedProxyHops) || trustedProxyHops < 0 || trustedProxyHops > 5) {
  throw new Error("TRUST_PROXY_HOPS must be an integer between 0 and 5.");
}
if (trustedProxyHops > 0 && trustedProxies.length) throw new Error("Configure TRUST_PROXY_HOPS or TRUSTED_PROXIES, not both.");
if (trustedProxyHops > 0) app.set("trust proxy", trustedProxyHops);
else if (trustedProxies.length) app.set("trust proxy", trustedProxies);

app.disable("x-powered-by");
app.use((req, res, next) => {
  const origin = req.get("origin");
  if (origin && origin !== allowedOrigin) {
    return res.status(403).json({ error: { code: "ORIGIN_NOT_ALLOWED", message: "Origine nepermisă." } });
  }
  if (origin) {
    res.set("Access-Control-Allow-Origin", origin);
    res.set("Vary", "Origin");
    res.set("Access-Control-Allow-Credentials", "true");
  }
  res.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.set("Access-Control-Allow-Headers", "Authorization,Content-Type");
  res.set("X-Content-Type-Options", "nosniff");
  res.set("X-Frame-Options", "DENY");
  res.set("Referrer-Policy", "no-referrer");
  res.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.set("X-DNS-Prefetch-Control", "off");
  if (process.env.NODE_ENV === "production") {
    res.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
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

