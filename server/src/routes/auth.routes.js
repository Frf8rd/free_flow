const { Router } = require("express");
const prisma = require("../config/prisma");
const { authenticate } = require("../middlewares/auth");
const { rateLimit } = require("../middlewares/rateLimit");
const authService = require("../services/auth.service");
const { verifyPassword, hashPassword } = require("../utils/hash");
const { getRefreshToken, setRefreshCookie, clearRefreshCookie } = require("../utils/refreshCookie");

const router = Router();
const loginLimiter = rateLimit({ name: "auth-attempt", max: 10 });
const refreshLimiter = rateLimit({ name: "auth-refresh", max: 60 });

function respondWithSession(res, session, status = 200) {
  setRefreshCookie(res, session.refreshToken);
  res.status(status).json({
    user: session.user,
    accessToken: session.accessToken,
  });
}

router.post("/register", loginLimiter, async (req, res) => {
  const session = await authService.register(req.body);
  respondWithSession(res, session, 201);
});

router.post("/login", loginLimiter, async (req, res) => {
  respondWithSession(res, await authService.login(req.body));
});

router.post("/oauth/google/challenge", loginLimiter, async (req, res) => {
  res.json(await authService.createOAuthChallenge("google"));
});

router.post("/oauth/google", loginLimiter, async (req, res) => {
  const session = await authService.loginWithProvider("google", req.body);
  respondWithSession(res, session);
});

router.post("/refresh", refreshLimiter, async (req, res) => {
  const session = await authService.refresh(getRefreshToken(req));
  respondWithSession(res, session);
});

router.post("/logout", authenticate, async (req, res) => {
  await authService.logout(req.user.id);
  clearRefreshCookie(res);
  res.status(204).end();
});

router.delete("/me", authenticate, async (req, res) => {
  await prisma.user.delete({ where: { id: req.user.id } });
  clearRefreshCookie(res);
  res.status(204).end();
});

router.post("/change-password", authenticate, async (req, res) => {
  const { oldPassword, newPassword } = req.body || {};
  if (
    (oldPassword !== undefined && typeof oldPassword !== "string") ||
    typeof newPassword !== "string" ||
    newPassword.length < 12 ||
    Buffer.byteLength(newPassword) > 256
  ) {
    return res.status(400).json({
      error: { code: "VALIDATION_ERROR", message: "Parola nouă trebuie să aibă cel puțin 12 caractere." },
    });
  }

  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (
    !user ||
    (user.passwordHash && !(await verifyPassword(oldPassword || "", user.passwordHash)))
  ) {
    return res.status(401).json({
      error: { code: "INVALID_CREDENTIALS", message: "Parola curentă este incorectă." },
    });
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: req.user.id },
      data: {
        passwordHash: await hashPassword(newPassword),
        tokenVersion: { increment: 1 },
      },
    }),
    prisma.refreshToken.updateMany({
      where: { userId: req.user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);
  clearRefreshCookie(res);
  res.status(204).end();
});

router.get("/me", authenticate, async (req, res) => {
  const safeUser = {
    id: req.user.id,
    email: req.user.email,
    name: req.user.name,
    role: req.user.role,
    avatarUrl: req.user.avatarUrl,
  };
  res.json({ user: safeUser });
});

module.exports = router;