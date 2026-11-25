const { Router } = require("express");
const { authenticate } = require("../middlewares/auth");
const { requireRole } = require("../middlewares/requireRole");
const { rateLimit } = require("../middlewares/rateLimit");
const controller = require("../controllers/clients.controller");

const router = Router();
const profileLimiter = rateLimit({ name: "clients-profile", windowMs: 15 * 60 * 1000, max: 20 });

router.use(authenticate, requireRole("CLIENT"));

router.get("/me", controller.getMe);
router.put("/me", profileLimiter, controller.updateMe);

module.exports = router;