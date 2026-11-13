const { AppError } = require("../utils/errors");

function rateLimit({ windowMs = 15 * 60 * 1000, max = 10 } = {}) {
  const requests = new Map();

  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip || req.socket.remoteAddress || "unknown";
    let entry = requests.get(key);

    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      requests.set(key, entry);
    }
    entry.count += 1;
    if (requests.size > 10000) {
      for (const [ip, item] of requests) {
        if (item.resetAt <= now) requests.delete(ip);
      }
    }

    res.set("RateLimit-Limit", String(max));
    res.set("RateLimit-Remaining", String(Math.max(0, max - entry.count)));
    res.set("RateLimit-Reset", String(Math.ceil(entry.resetAt / 1000)));
    if (entry.count > max) {
      res.set("Retry-After", String(Math.ceil((entry.resetAt - now) / 1000)));
      return next(new AppError(429, "RATE_LIMITED", "Prea multe cereri. Încearcă din nou mai târziu."));
    }
    return next();
  };
}

module.exports = { rateLimit };