const prisma = require("../config/prisma");
const { verifyAccessToken } = require("../utils/jwt");
const { isAdminAllowlisted } = require("../utils/adminAccess");

async function authenticate(req, res, next) {
  const authorization = req.get("authorization") || "";
  const match = authorization.match(/^Bearer ([^\s]+)$/i);
  if (!match) {
    return res.status(401).json({ error: { code: "UNAUTHENTICATED", message: "Autentificare necesară." } });
  }

  try {
    const claims = verifyAccessToken(match[1]);
    if (!claims) {
      return res.status(401).json({ error: { code: "INVALID_TOKEN", message: "Sesiune invalidă sau expirată." } });
    }

    const user = await prisma.user.findUnique({
      where: { id: claims.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarUrl: true,
        isBlocked: true,
        tokenVersion: true,
      },
    });
    if (!user || user.isBlocked || claims.tokenVersion !== user.tokenVersion) {
      return res.status(401).json({ error: { code: "INVALID_TOKEN", message: "Sesiune invalidă sau expirată." } });
    }
    if (user.role === "ADMIN" && !(await isAdminAllowlisted(user.email))) {
      return res.status(403).json({ error: { code: "FORBIDDEN", message: "Contul nu este autorizat ca administrator." } });
    }

    req.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = { authenticate };