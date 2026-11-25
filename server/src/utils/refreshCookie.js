const REFRESH_COOKIE_NAME = "fairmatch_refresh";
const REFRESH_COOKIE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

function getRefreshToken(req) {
  const cookies = req.headers.cookie || "";
  for (const part of cookies.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0 || part.slice(0, separator).trim() !== REFRESH_COOKIE_NAME) continue;
    try {
      return decodeURIComponent(part.slice(separator + 1).trim());
    } catch {
      return null;
    }
  }
  return null;
}

function setRefreshCookie(res, token) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.append(
    "Set-Cookie",
    `${REFRESH_COOKIE_NAME}=${encodeURIComponent(token)}; Max-Age=${REFRESH_COOKIE_MAX_AGE_SECONDS}; Path=/api/auth; HttpOnly; SameSite=Lax${secure}`,
  );
}

function clearRefreshCookie(res) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.append(
    "Set-Cookie",
    `${REFRESH_COOKIE_NAME}=; Max-Age=0; Path=/api/auth; HttpOnly; SameSite=Lax${secure}`,
  );
}

module.exports = {
  REFRESH_COOKIE_NAME,
  REFRESH_COOKIE_MAX_AGE_SECONDS,
  getRefreshToken,
  setRefreshCookie,
  clearRefreshCookie,
};
