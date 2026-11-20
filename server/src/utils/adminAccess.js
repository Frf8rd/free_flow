const prisma = require("../config/prisma");

async function isAdminAllowlisted(email, db = prisma) {
  if (typeof email !== "string" || !email) return false;
  const entry = await db.admin.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: { email: true },
  });
  return entry !== null;
}

module.exports = { isAdminAllowlisted };
