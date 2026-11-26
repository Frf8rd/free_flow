const { Router } = require("express");
const { authenticate, authenticateOptional } = require("../middlewares/auth");
const { requireRole } = require("../middlewares/requireRole");
const { rateLimit } = require("../middlewares/rateLimit");
const projectsController = require("../controllers/projects.controller");
const attachmentsController = require("../controllers/project-attachments.controller");
const { uploadProjectImage } = require("../middlewares/imageUpload");

const router = Router();
const projectMutationLimiter = rateLimit({
  name: "project-mutation",
  windowMs: 15 * 60 * 1000,
  max: 30,
});

router.get("/", projectsController.list);
router.get("/me", authenticate, requireRole("CLIENT"), projectsController.listMine);
router.get("/:id/matches", authenticate, requireRole("CLIENT"), projectsController.matches);
router.get("/:id/attachments", authenticate, attachmentsController.list);
router.get("/:id/attachments/:attachmentId/file", authenticateOptional, attachmentsController.file);
router.post("/", authenticate, requireRole("CLIENT"), projectMutationLimiter, projectsController.create);
router.patch("/:id", authenticate, requireRole("CLIENT"), projectMutationLimiter, projectsController.update);
router.patch("/:id/close", authenticate, requireRole("CLIENT"), projectMutationLimiter, projectsController.close);
router.patch("/:id/reopen", authenticate, requireRole("CLIENT"), projectMutationLimiter, projectsController.reopen);
router.delete("/:id", authenticate, requireRole("CLIENT"), projectMutationLimiter, projectsController.remove);
router.post("/:id/attachments", authenticate, requireRole("CLIENT"), projectMutationLimiter, uploadProjectImage, attachmentsController.upload);
router.delete("/:id/attachments/:attachmentId", authenticate, requireRole("CLIENT"), projectMutationLimiter, attachmentsController.remove);
router.get("/:id", authenticateOptional, projectsController.getById);

module.exports = router;
