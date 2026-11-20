const { Router } = require("express");
const { authenticate } = require("../middlewares/auth");
const { rateLimit } = require("../middlewares/rateLimit");
const controller = require("../controllers/conversations.controller");

const router = Router();
const messageLimiter = rateLimit({ name: "chat-message", windowMs: 60 * 1000, max: 30 });

router.use(authenticate);
router.get("/", controller.list);
router.get("/:id/messages", controller.messages);
router.post("/:id/messages", messageLimiter, controller.send);
router.patch("/:id/read", controller.read);

module.exports = router;
