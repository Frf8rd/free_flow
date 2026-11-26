const { Router } = require("express");
const { authenticate } = require("../middlewares/auth");
const { rateLimit } = require("../middlewares/rateLimit");
const controller = require("../controllers/users.controller");
const { clearRefreshCookie } = require("../utils/refreshCookie");
const { writeAuditLog } = require("../utils/auditLog");
const authService = require("../services/auth.service");

const router = Router();
const profileLimiter = rateLimit({ name: "users-profile", windowMs: 15 * 60 * 1000, max: 20 });

router.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

router.patch("/me", authenticate, profileLimiter, controller.patchMe);
router.delete("/me", authenticate, profileLimiter, async (req, res) => {
  await authService.deleteAccount(req.user.id, req.body);
  writeAuditLog("account.deleted", { actorId: req.user.id, resourceId: req.user.id });
  clearRefreshCookie(res);
  res.status(204).end();
});

module.exports = router;
