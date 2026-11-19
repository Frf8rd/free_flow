const { Router } = require("express");
const { authenticate } = require("../middlewares/auth");
const { requireRole } = require("../middlewares/requireRole");
const { rateLimit } = require("../middlewares/rateLimit");
const projectsController = require("../controllers/projects.controller");

const router = Router();
const projectMutationLimiter = rateLimit({
  name: "project-mutation",
  windowMs: 15 * 60 * 1000,
  max: 30,
});

router.use(authenticate);
router.post("/", requireRole("CLIENT"), projectMutationLimiter, projectsController.create);
router.get("/", projectsController.list);
router.get("/me", requireRole("CLIENT"), projectsController.listMine);
router.patch("/:id", requireRole("CLIENT"), projectMutationLimiter, projectsController.update);
router.patch("/:id/close", requireRole("CLIENT"), projectMutationLimiter, projectsController.close);
router.patch("/:id/reopen", requireRole("CLIENT"), projectMutationLimiter, projectsController.reopen);
router.delete("/:id", requireRole("CLIENT"), projectMutationLimiter, projectsController.remove);
router.get("/:id", projectsController.getById);

module.exports = router;