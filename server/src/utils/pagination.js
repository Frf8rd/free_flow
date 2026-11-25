const { AppError } = require("./errors");

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

// Aceleași reguli ca la GET /projects: page >= 1, limit între 1 și 100.
function parsePagination(query = {}) {
  const page = query.page === undefined ? 1 : Number(query.page);
  const limit = query.limit === undefined ? DEFAULT_LIMIT : Number(query.limit);
  if (!Number.isInteger(page) || page < 1) {
    throw new AppError(400, "VALIDATION_ERROR", "Parametrul page trebuie să fie un număr pozitiv.");
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
    throw new AppError(400, "VALIDATION_ERROR", `Parametrul limit trebuie să fie între 1 și ${MAX_LIMIT}.`);
  }
  return { page, limit };
}

module.exports = { parsePagination, DEFAULT_LIMIT, MAX_LIMIT };