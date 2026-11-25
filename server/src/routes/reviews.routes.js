const { Router } = require("express");
const { authenticate } = require("../middlewares/auth");
const { rateLimit } = require("../middlewares/rateLimit");
const controller = require("../controllers/reviews.controller");

const router = Router();
const mutationLimiter = rateLimit({ name: "review-mutation", windowMs: 15 * 60 * 1000, max: 30 });

router.use(authenticate);
router.patch("/:id", mutationLimiter, controller.update);
router.delete("/:id", mutationLimiter, controller.remove);

module.exports = router;