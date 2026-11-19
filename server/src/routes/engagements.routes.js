const { Router } = require("express");
const { authenticate } = require("../middlewares/auth");
const { requireRole } = require("../middlewares/requireRole");
const { rateLimit } = require("../middlewares/rateLimit");
const controller = require("../controllers/engagements.controller");

const router = Router();
const mutationLimiter = rateLimit({ name: "engagement-mutation", windowMs: 15 * 60 * 1000, max: 30 });

router.use(authenticate);
router.get("/", controller.list);
router.post("/", requireRole("FREELANCER"), mutationLimiter, controller.create);
router.patch("/:id", requireRole("CLIENT"), mutationLimiter, controller.update);

module.exports = router;
