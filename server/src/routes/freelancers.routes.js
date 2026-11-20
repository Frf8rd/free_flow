const { Router } = require("express");
const { authenticate } = require("../middlewares/auth");
const { requireRole } = require("../middlewares/requireRole");
const { rateLimit } = require("../middlewares/rateLimit");
const controller = require("../controllers/freelancers.controller");

const router = Router();
const mutationLimiter = rateLimit({
  name: "freelancer-mutation",
  windowMs: 15 * 60 * 1000,
  max: 30,
});

router.use(authenticate);

router.get("/me", requireRole("FREELANCER"), controller.getMe);
router.put("/me", requireRole("FREELANCER"), mutationLimiter, controller.updateMe);

router.get("/me/portfolio", requireRole("FREELANCER"), controller.listPortfolio);
router.post("/me/portfolio", requireRole("FREELANCER"), mutationLimiter, controller.createPortfolioItem);
router.put("/me/portfolio/:itemId", requireRole("FREELANCER"), mutationLimiter, controller.updatePortfolioItem);
router.delete("/me/portfolio/:itemId", requireRole("FREELANCER"), mutationLimiter, controller.deletePortfolioItem);

router.get("/:id", controller.getById);

module.exports = router;