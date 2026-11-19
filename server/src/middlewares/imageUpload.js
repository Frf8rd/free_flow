const multer = require("multer");
const { AppError } = require("../utils/errors");

const uploadProjectImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 0, parts: 1 },
  fileFilter(req, file, callback) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
      callback(new AppError(415, "UNSUPPORTED_IMAGE", "Sunt acceptate doar imagini JPEG, PNG sau WebP."));
      return;
    }
    callback(null, true);
  },
}).single("image");

module.exports = { uploadProjectImage };
