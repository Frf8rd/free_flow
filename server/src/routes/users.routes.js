const { Router } = require("express");
const { authenticate } = require("../middlewares/auth");
const { rateLimit } = require("../middlewares/rateLimit");
const controller = require("../controllers/users.controller");

const router = Router();
const profileLimiter = rateLimit({ name: "users-profile", windowMs: 15 * 60 * 1000, max: 20 });

router.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

router.patch("/me", authenticate, profileLimiter, controller.patchMe);

module.exports = router;