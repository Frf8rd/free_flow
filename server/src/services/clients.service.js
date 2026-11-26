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
  clientProfile: { select: { type: true, onboarded: true, companyName: true, description: true, industry: true } },
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
  const { name, avatarUrl, type, companyName, description, industry } = parse(clientProfileSchema, input);
  const userData = Object.fromEntries(Object.entries({ name, avatarUrl }).filter(([, value]) => value !== undefined));
  const profileData = Object.fromEntries(Object.entries({ type, companyName, description, industry }).filter(([, value]) => value !== undefined));
  await db.$transaction(async (tx) => {
    if (Object.keys(userData).length) await tx.user.update({ where: { id: userId }, data: userData, select: { id: true } });
    if (Object.keys(profileData).length) {
      const existing = await tx.clientProfile.findUnique({ where: { userId }, select: { type: true, industry: true, companyName: true, onboarded: true } });
      const type = profileData.type ?? existing?.type ?? "PERSON";
      const industry = profileData.industry ?? existing?.industry ?? null;
      const companyName = profileData.companyName ?? existing?.companyName ?? null;
      const hasIdentity = type === "PERSON" || Boolean(companyName?.trim());
      const onboarded = Boolean((profileData.type !== undefined || existing?.onboarded) && industry?.trim() && hasIdentity);
      await tx.clientProfile.upsert({ where: { userId }, create: { userId, ...profileData, onboarded }, update: { ...profileData, onboarded } });
    }
  });
  return getMyProfile(userId, db);
}

module.exports = { getMyProfile, updateMyProfile };
