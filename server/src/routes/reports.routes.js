const { Router } = require("express");
const { authenticate } = require("../middlewares/auth");
const { requireRole } = require("../middlewares/requireRole");
const { rateLimit } = require("../middlewares/rateLimit");
const reportsController = require("../controllers/reports.controller");

const router = Router();
const reportLimiter = rateLimit({
  name: "report-create",
  windowMs: 60 * 60 * 1000,
  max: 20,
});

// Adminii moderează direct din /admin; raportările vin de la clienți și freelanceri.
router.post("/", authenticate, requireRole("CLIENT", "FREELANCER"), reportLimiter, reportsController.create);

module.exports = router;