const test = require("node:test");
const assert = require("node:assert/strict");
const { rateLimit } = require("./rateLimit");

process.env.JWT_SECRET = "test-only-secret-that-is-at-least-32-bytes-long";

function createStore() {
  const buckets = new Map();
  return {
    keys: [],
    async consume(key, now, windowMs) {
      this.keys.push(key);
      let bucket = buckets.get(key);
      if (!bucket || bucket.resetAt <= now) {
        bucket = { count: 0, resetAt: new Date(now.getTime() + windowMs) };
        buckets.set(key, bucket);
      }
      bucket.count += 1;
      return bucket;
    },
  };
}

async function invoke(middleware, ip = "203.0.113.5") {
  const headers = {};
  let error;
  await middleware(
    { ip, socket: { remoteAddress: ip } },
    { set: (name, value) => { headers[name] = value; } },
    (nextError) => { error = nextError; },
  );
  return { headers, error };
}

test("rate limit counters are shared across middleware instances and do not store raw IP addresses", async () => {
  const store = createStore();
  const firstLimiter = rateLimit({ name: "auth", max: 1, store });
  const secondLimiter = rateLimit({ name: "auth", max: 1, store });

  assert.equal((await invoke(firstLimiter)).error, undefined);
  const limited = await invoke(secondLimiter);

  assert.equal(limited.error.status, 429);
  assert.equal(limited.error.code, "RATE_LIMITED");
  assert.equal(limited.headers["RateLimit-Remaining"], "0");
  assert.ok(limited.headers["Retry-After"]);
  assert.ok(store.keys.every((key) => !key.includes("203.0.113.5")));
});

test("rate limits use separate buckets for distinct named scopes", async () => {
  const store = createStore();
  const loginLimiter = rateLimit({ name: "login", max: 1, store });
  const refreshLimiter = rateLimit({ name: "refresh", max: 1, store });

  assert.equal((await invoke(loginLimiter)).error, undefined);
  assert.equal((await invoke(refreshLimiter)).error, undefined);
  assert.notEqual(store.keys[0], store.keys[1]);
});

test("rate limiter fails closed with a service error when its store is unavailable", async () => {
  const originalConsoleError = console.error;
  console.error = () => {};
  try {
    const limiter = rateLimit({
      store: { consume: async () => { throw new Error("storage unavailable"); } },
    });
    const result = await invoke(limiter);

    assert.equal(result.error.status, 503);
    assert.equal(result.error.code, "RATE_LIMIT_UNAVAILABLE");
  } finally {
    console.error = originalConsoleError;
  }
});
