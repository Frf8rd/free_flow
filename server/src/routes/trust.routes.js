const { Router } = require("express");
const { authenticate } = require("../middlewares/auth");
const trustController = require("../controllers/trust.controller");

const router = Router();

router.use(authenticate);
// /me trebuie înaintea lui /:userId, altfel "me" ar fi tratat ca id.
router.get("/me", trustController.getMine);
router.get("/:userId", trustController.getByUser);

module.exports = router;