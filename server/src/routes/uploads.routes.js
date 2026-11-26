const { Router } = require('express');
const multer = require('multer');
const { authenticate } = require('../middlewares/auth');
const { rateLimit } = require('../middlewares/rateLimit');
const { AppError } = require('../utils/errors');
const controller = require('../controllers/uploads.controller');

const router = Router();
const limiter = rateLimit({ name: 'profile-image-upload', windowMs: 60 * 60 * 1000, max: 30 });
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 1, parts: 2 }, fileFilter(_req, file, callback) {
  callback(['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype) ? null : new AppError(415, 'UNSUPPORTED_IMAGE', 'Sunt acceptate doar imagini JPG, PNG sau WebP.'));
} }).single('file');

router.post('/', authenticate, limiter, upload, controller.create);
router.get('/:key', controller.read);

module.exports = router;
