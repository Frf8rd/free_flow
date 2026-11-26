const { AppError } = require("../utils/errors");

function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  if (error instanceof AppError) {
    return res.status(error.status).json({
      error: { code: error.code, message: error.message },
    });
  }

  if (error && error.type === "entity.parse.failed") {
    return res.status(400).json({
      error: { code: "INVALID_JSON", message: "Corpul cererii trebuie să fie JSON valid." },
    });
  }

  if (error && error.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: { code: "IMAGE_TOO_LARGE", message: "Imaginea trebuie să aibă maximum 5 MB." } });
  }
  if (error && typeof error.code === "string" && error.code.startsWith("LIMIT_")) {
    return res.status(400).json({ error: { code: "INVALID_UPLOAD", message: "Verifică fișierul și câmpurile trimise la încărcare." } });
  }

  if (error && error.code === "P2002") {
    return res.status(409).json({
      error: { code: "CONFLICT", message: "Există deja un cont cu aceste date." },
    });
  }

  console.error(error);
  return res.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "A apărut o eroare internă." },
  });
}

module.exports = { errorHandler };
