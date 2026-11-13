const { createHmac, timingSafeEqual } = require("node:crypto");

const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;

function getSecret() {
  const secret = process.env.JWT_SECRET || process.env.JWT_ACCESS_SECRET;
  if (!secret || Buffer.byteLength(secret) < 32) {
    throw new Error("JWT_SECRET must be set to at least 32 bytes.");
  }
  return secret;
}

function encode(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function signAccessToken(user, tokenVersion = 0) {
  const now = Math.floor(Date.now() / 1000);
  const header = encode({ alg: "HS256", typ: "JWT" });
  const payload = encode({
    sub: user.id,
    ver: tokenVersion,
    iat: now,
    exp: now + ACCESS_TOKEN_TTL_SECONDS,
  });
  const data = `${header}.${payload}`;
  const signature = createHmac("sha256", getSecret()).update(data).digest("base64url");
  return `${data}.${signature}`;
}

function verifyAccessToken(token) {
  if (typeof token !== "string") return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [headerPart, payloadPart, signature] = parts;
  let header;
  let payload;
  try {
    header = JSON.parse(Buffer.from(headerPart, "base64url").toString("utf8"));
    payload = JSON.parse(Buffer.from(payloadPart, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  if (!header || typeof header !== "object" || !payload || typeof payload !== "object") return null;
  if (header.alg !== "HS256" || header.typ !== "JWT") return null;

  const expected = createHmac("sha256", getSecret())
    .update(`${headerPart}.${payloadPart}`)
    .digest();
  let actual;
  try {
    actual = Buffer.from(signature, "base64url");
  } catch {
    return null;
  }
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  if (typeof payload.sub !== "string" || !payload.sub) return null;
  if (!Number.isInteger(payload.ver) || payload.ver < 0) return null;
  if (!Number.isInteger(payload.exp) || payload.exp <= Math.floor(Date.now() / 1000)) return null;

  return { userId: payload.sub, tokenVersion: payload.ver };
}

module.exports = { ACCESS_TOKEN_TTL_SECONDS, signAccessToken, verifyAccessToken };