const { Router } = require("express");
const { authenticate } = require("../middlewares/auth");
const { rateLimit } = require("../middlewares/rateLimit");
const controller = require("../controllers/notifications.controller");

const router = Router();
const mutationLimiter = rateLimit({
  name: "notification-mutation",
  windowMs: 60 * 1000,
  max: 60,
});

router.use(authenticate);
router.get("/", controller.list);
router.patch("/read-all", mutationLimiter, controller.readAll);
router.patch("/:id/read", mutationLimiter, controller.read);

module.exports = router;