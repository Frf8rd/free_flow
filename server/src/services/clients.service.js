const prisma = require("../config/prisma");
const { AppError } = require("../utils/errors");
const { clientProfileSchema, parse } = require("../validators/users.validator");

const profileSelect = {
  id: true,
  name: true,
  email: true,
  avatarUrl: true,
  emailVerifiedAt: true,
  createdAt: true,
};

async function getMyProfile(userId, db = prisma) {
  const [profile, projectsCount, openProjectsCount] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: profileSelect }),
    db.project.count({ where: { clientId: userId } }),
    db.project.count({ where: { clientId: userId, status: "OPEN" } }),
  ]);
  if (!profile) throw new AppError(404, "NOT_FOUND", "Profilul nu a fost găsit.");
  return { ...profile, projectsCount, openProjectsCount };
}

async function updateMyProfile(userId, input, db = prisma) {
  const data = parse(clientProfileSchema, input);
  await db.user.update({ where: { id: userId }, data, select: { id: true } });
  return getMyProfile(userId, db);
}

module.exports = { getMyProfile, updateMyProfile };