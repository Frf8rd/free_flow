const { Router } = require("express");
const prisma = require("../config/prisma");
const { authenticate } = require("../middlewares/auth");
const { rateLimit } = require("../middlewares/rateLimit");
const { AppError } = require("../utils/errors");
const { writeAuditLog } = require("../utils/auditLog");
const authService = require("../services/auth.service");
const accountSecurity = require("../services/account-security.service");
const { getRefreshToken, setRefreshCookie, clearRefreshCookie } = require("../utils/refreshCookie");

const router = Router();
const loginLimiter = rateLimit({
  name: "auth-attempt",
  max: process.env.NODE_ENV === "production" ? 10 : 100,
});
// Butonul Google cere o provocare la fiecare încărcare a paginii; nu trebuie să consume
// limita strictă de login/înregistrare (altfel câteva refresh-uri blochează formularul).
const oauthChallengeLimiter = rateLimit({
  name: "auth-oauth-challenge",
  max: process.env.NODE_ENV === "production" ? 60 : 300,
});
const refreshLimiter = rateLimit({ name: "auth-refresh", max: 60 });
const sensitiveActionLimiter = rateLimit({
  name: "auth-sensitive-action",
  windowMs: 15 * 60 * 1000,
  max: 5,
});
const emailVerificationLimiter = rateLimit({
  name: "auth-email-verification",
  windowMs: 15 * 60 * 1000,
  max: 5,
});
const passwordResetLimiter = rateLimit({
  name: "auth-password-reset",
  windowMs: 15 * 60 * 1000,
  max: 5,
});

router.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  res.set("Pragma", "no-cache");
  next();
});

function getEmailInput(req) {
  const email = req.body && req.body.email;
  if (
    typeof email !== "string" ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  ) {
    throw new AppError(400, "VALIDATION_ERROR", "Adresa de email nu este validă.");
  }
  return email.trim().toLowerCase();
}

function respondWithSession(res, session, status = 200) {
  setRefreshCookie(res, session.refreshToken);
  res.status(status).json({
    user: session.user,
    accessToken: session.accessToken,
  });
}

router.post("/register", loginLimiter, async (req, res) => {
  const result = await authService.register(req.body);
  res.status(201).json(result);
});

router.post("/login", loginLimiter, async (req, res) => {
  respondWithSession(res, await authService.login(req.body));
});

router.post("/oauth/google/challenge", oauthChallengeLimiter, async (req, res) => {
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

router.post("/email-verification/resend", emailVerificationLimiter, async (req, res) => {
  res.json(await accountSecurity.requestEmailVerification(getEmailInput(req)));
});

router.post("/email-verification/confirm", emailVerificationLimiter, async (req, res) => {
  const result = await authService.verifyEmail(req.body && req.body.token);
  res.json({
    email: result.email,
    message: "Contul a fost verificat cu succes. Autentifică-te pentru a începe.",
  });
});

router.post("/password-reset/request", passwordResetLimiter, async (req, res) => {
  res.json(await accountSecurity.requestPasswordReset(getEmailInput(req)));
});
router.post("/forgot-password", passwordResetLimiter, async (req, res) => {
  res.json(await accountSecurity.requestPasswordReset(getEmailInput(req)));
});

router.post("/password-reset/confirm", passwordResetLimiter, async (req, res) => {
  await accountSecurity.resetPassword(
    req.body && req.body.token,
    req.body && req.body.newPassword,
  );
  res.json({ message: "Parola a fost resetată. Te poți autentifica." });
});
router.post("/reset-password", passwordResetLimiter, async (req, res) => {
  await accountSecurity.resetPassword(req.body && req.body.token, req.body && req.body.password);
  res.json({ message: "Parola a fost resetată. Te poți autentifica." });
});

router.post("/logout", authenticate, async (req, res) => {
  await authService.logout(req.user.id);
  clearRefreshCookie(res);
  res.status(204).end();
});

router.delete("/me", authenticate, sensitiveActionLimiter, async (req, res) => {
  const actorId = req.user.id;
  await authService.deleteAccount(actorId, req.body);
  writeAuditLog("account.deleted", { actorId, resourceId: actorId });
  clearRefreshCookie(res);
  res.status(204).end();
});

router.post("/change-password", authenticate, sensitiveActionLimiter, async (req, res) => {
  await authService.changePassword(req.user.id, req.body);
  writeAuditLog("account.password_changed", { actorId: req.user.id, resourceId: req.user.id });
  clearRefreshCookie(res);
  res.status(204).end();
});

router.get("/me", authenticate, async (req, res) => {
  const credentials = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { passwordHash: true, isBlocked: true, createdAt: true, clientProfile: { select: { onboarded: true } }, freelancerProfile: { select: { onboarded: true } } },
  });
  const safeUser = {
    id: req.user.id,
    email: req.user.email,
    name: req.user.name,
    role: req.user.role,
    avatarUrl: req.user.avatarUrl,
    dashboardBackgroundUrl: req.user.dashboardBackgroundUrl,
    isBlocked: credentials?.isBlocked ?? false,
    createdAt: credentials?.createdAt ?? null,
    onboarded: req.user.role === "ADMIN" || (req.user.role === "FREELANCER" ? Boolean(credentials?.freelancerProfile?.onboarded) : Boolean(credentials?.clientProfile?.onboarded)),
    hasPassword: Boolean(credentials && credentials.passwordHash),
  };
  res.json({ user: safeUser });
});

module.exports = router;