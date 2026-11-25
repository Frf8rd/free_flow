const { randomBytes, scrypt: scryptCallback, timingSafeEqual, createHash } = require("node:crypto");
const { promisify } = require("node:util");

const scrypt = promisify(scryptCallback);
const SCRYPT_COST = 32768;
const KEY_LENGTH = 64;

async function deriveKey(password, salt, cost = SCRYPT_COST) {
  return scrypt(password, salt, KEY_LENGTH, {
    N: cost,
    r: 8,
    p: 1,
    maxmem: 64 * 1024 * 1024,
  });
}

async function hashPassword(password) {
  const salt = randomBytes(16);
  const key = await deriveKey(password, salt);
  return `scrypt$${SCRYPT_COST}$${salt.toString("base64url")}$${key.toString("base64url")}`;
}

async function verifyPassword(password, encodedHash) {
  const [algorithm, costText, saltText, keyText] = String(encodedHash || "").split("$");
  const cost = Number(costText);
  if (
    algorithm !== "scrypt" ||
    !Number.isInteger(cost) ||
    cost < 16384 ||
    cost > 131072 ||
    !saltText ||
    !keyText
  ) {
    await deriveKey(password, Buffer.alloc(16));
    return false;
  }

  const expected = Buffer.from(keyText, "base64url");
  if (expected.length !== KEY_LENGTH) {
    await deriveKey(password, Buffer.alloc(16), cost);
    return false;
  }
  const actual = await deriveKey(password, Buffer.from(saltText, "base64url"), cost);
  return timingSafeEqual(actual, expected);
}

function hashRefreshToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

module.exports = { hashPassword, verifyPassword, hashRefreshToken };