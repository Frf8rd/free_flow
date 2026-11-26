const { Router } = require("express");
const { authenticate } = require("../middlewares/auth");
const { requireRole } = require("../middlewares/requireRole");
const { rateLimit } = require("../middlewares/rateLimit");
const controller = require("../controllers/engagements.controller");
const reviewsController = require("../controllers/reviews.controller");

const router = Router();
const mutationLimiter = rateLimit({ name: "engagement-mutation", windowMs: 15 * 60 * 1000, max: 30 });

router.use(authenticate);
router.get("/me", controller.list);
router.post("/", requireRole("FREELANCER"), mutationLimiter, controller.create);
router.get("/:id", controller.getById);
router.patch("/:id/status", mutationLimiter, controller.update);
router.patch("/:id/ai-disclosure", requireRole("FREELANCER"), mutationLimiter, controller.discloseAi);
router.post("/:id/reviews", mutationLimiter, reviewsController.create);

module.exports = router;
