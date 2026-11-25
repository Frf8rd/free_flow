const { createHmac } = require("node:crypto");
const prisma = require("../config/prisma");
const { AppError } = require("../utils/errors");

const CLEANUP_INTERVAL_MS = 15 * 60 * 1000;
const memoryBuckets = new Map();
let lastCleanupAt = 0;
let cleanupInProgress = false;

const postgresStore = {
  async consume(key, now, windowMs) {
    const resetAt = new Date(now.getTime() + windowMs);
    const [bucket] = await prisma.$queryRaw`
      INSERT INTO "RateLimitBucket" ("key", "count", "resetAt")
      VALUES (${key}, 1, ${resetAt})
      ON CONFLICT ("key") DO UPDATE
      SET
        "count" = CASE
          WHEN "RateLimitBucket"."resetAt" <= ${now} THEN 1
          ELSE "RateLimitBucket"."count" + 1
        END,
        "resetAt" = CASE
          WHEN "RateLimitBucket"."resetAt" <= ${now} THEN ${resetAt}
          ELSE "RateLimitBucket"."resetAt"
        END
      RETURNING "count", "resetAt"
    `;
    if (!bucket) throw new Error("Rate-limit counter was not returned by PostgreSQL.");
    return bucket;
  },

  pruneExpired(now) {
    return prisma.$executeRaw`
      DELETE FROM "RateLimitBucket" WHERE "resetAt" <= ${now}
    `;
  },
};

const memoryStore = {
  async consume(key, now, windowMs) {
    let bucket = memoryBuckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: new Date(now.getTime() + windowMs) };
      memoryBuckets.set(key, bucket);
    }
    bucket.count += 1;
    if (memoryBuckets.size > 10000) {
      for (const [storedKey, entry] of memoryBuckets) {
        if (entry.resetAt <= now) memoryBuckets.delete(storedKey);
      }
    }
    return bucket;
  },
};

function getClientKey(name, ip) {
  const secret = process.env.JWT_SECRET || process.env.JWT_ACCESS_SECRET;
  if (!secret) throw new Error("JWT_SECRET must be configured for rate limiting.");
  return createHmac("sha256", secret).update(`${name}\0${ip}`).digest("hex");
}

function scheduleCleanup(store, now) {
  if (
    typeof store.pruneExpired !== "function" ||
    cleanupInProgress ||
    now.getTime() - lastCleanupAt < CLEANUP_INTERVAL_MS
  ) {
    return;
  }

  cleanupInProgress = true;
  lastCleanupAt = now.getTime();
  store.pruneExpired(now)
    .catch((error) => {
      lastCleanupAt = 0;
      console.error("Could not clean expired rate-limit buckets.", error);
    })
    .finally(() => {
      cleanupInProgress = false;
    });
}

function rateLimit({ name = "default", windowMs = 15 * 60 * 1000, max = 10, store } = {}) {
  if (typeof name !== "string" || !name.trim()) {
    throw new TypeError("Rate-limit name must be a non-empty string.");
  }
  if (!Number.isFinite(windowMs) || windowMs < 1) {
    throw new TypeError("Rate-limit windowMs must be a positive number.");
  }
  if (!Number.isInteger(max) || max < 1) {
    throw new TypeError("Rate-limit max must be a positive integer.");
  }

  const selectedStore = store || (process.env.NODE_ENV === "test" ? memoryStore : postgresStore);

  return async (req, res, next) => {
    const now = new Date();
    const ip = req.ip || (req.socket && req.socket.remoteAddress) || "unknown";
    let bucket;

    try {
      bucket = await selectedStore.consume(getClientKey(name, ip), now, windowMs);
    } catch (error) {
      console.error("Rate-limit storage is unavailable.", error);
      return next(new AppError(
        503,
        "RATE_LIMIT_UNAVAILABLE",
        "Limitarea cererilor nu este disponibilă momentan. Încearcă din nou mai târziu.",
      ));
    }

    scheduleCleanup(selectedStore, now);
    const count = Number(bucket.count);
    const resetAt = new Date(bucket.resetAt);
    res.set("RateLimit-Limit", String(max));
    res.set("RateLimit-Remaining", String(Math.max(0, max - count)));
    res.set("RateLimit-Reset", String(Math.ceil(resetAt.getTime() / 1000)));

    if (count > max) {
      res.set("Retry-After", String(Math.max(1, Math.ceil((resetAt.getTime() - now.getTime()) / 1000))));
      return next(new AppError(429, "RATE_LIMITED", "Prea multe cereri. Încearcă din nou mai târziu."));
    }
    return next();
  };
}

module.exports = { rateLimit };
