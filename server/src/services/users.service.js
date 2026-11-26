const prisma = require("../config/prisma");
const { AppError } = require("../utils/errors");
const { userPatchSchema, parse } = require("../validators/users.validator");

const userSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  avatarUrl: true,
  dashboardBackgroundUrl: true,
  emailVerifiedAt: true,
};

// Dependențele care ating email/sesiuni se încarcă leneș și pot fi înlocuite în teste.
const defaultDeps = {
  assertEmailReady: () => require("./account-security.service").assertEmailReady(),
  assertReauthentication: (userId, proof) => require("./auth.service").assertReauthentication(userId, proof),
  sendVerificationEmail: (user, db) => require("./account-security.service").sendVerificationEmail(user, db),
  sendEmail: (message) => require("./email.service").sendEmail(message),
};

async function assertEmailAvailable(email, db) {
  const [user, pending] = await Promise.all([
    db.user.findUnique({ where: { email }, select: { id: true } }),
    db.pendingRegistration.findUnique({ where: { email }, select: { id: true } }),
  ]);
  if (user || pending) {
    throw new AppError(409, "EMAIL_IN_USE", "Această adresă de email este deja înregistrată.");
  }
}

async function updateProfileFields(userId, data, db) {
  return db.user.update({ where: { id: userId }, data, select: userSelect });
}

async function changeEmail(current, data, proof, db, deps) {
  if (current.role === "ADMIN") {
    // Accesul de administrator este legat de adresa de email din lista de acces.
    throw new AppError(403, "FORBIDDEN", "Emailul unui cont de administrator nu poate fi schimbat aici.");
  }
  deps.assertEmailReady();
  await deps.assertReauthentication(current.id, proof);
  await assertEmailAvailable(data.email, db);

  try {
    const updated = await db.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: current.id },
        data: { ...data, emailVerifiedAt: null, tokenVersion: { increment: 1 } },
        select: userSelect,
      });
      if (data.role === "CLIENT") await tx.clientProfile.upsert({ where: { userId: current.id }, create: { userId: current.id }, update: {} });
      if (data.role === "FREELANCER") await tx.freelancerProfile.upsert({ where: { userId: current.id }, create: { userId: current.id }, update: {} });
      await tx.refreshToken.updateMany({
        where: { userId: current.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      return user;
    });
    return await finishEmailChange(current, updated, deps, db);
  } catch (error) {
    if (error && error.code === "P2002") {
      throw new AppError(409, "EMAIL_IN_USE", "Această adresă de email este deja înregistrată.");
    }
    throw error;
  }
}

async function finishEmailChange(current, updated, deps, db) {
  let verificationEmailSent = true;
  try {
    await deps.sendVerificationEmail({ id: updated.id, email: updated.email, name: updated.name }, db);
  } catch {
    verificationEmailSent = false;
  }
  // Anunțăm adresa veche, ca titularul să observe o schimbare neautorizată.
  deps.sendEmail({
    to: current.email,
    subject: "Adresa de email FairMatch a fost schimbată",
    text: `Salut ${current.name},\n\nAdresa contului tău FairMatch a fost schimbată. Dacă nu ai făcut tu această schimbare, contactează echipa de suport.`,
  }).catch(() => {});

  return { user: updated, emailChanged: true, verificationEmailSent };
}

async function updateMe(currentUser, input, { db = prisma, ...overrides } = {}) {
  const deps = { ...defaultDeps, ...overrides };
  const { email, password, credential, nonce, role, ...profile } = parse(userPatchSchema, input);

  const data = {};
  if (profile.name !== undefined) data.name = profile.name;
  if (profile.avatarUrl !== undefined) data.avatarUrl = profile.avatarUrl;
  if (profile.dashboardBackgroundUrl !== undefined) data.dashboardBackgroundUrl = profile.dashboardBackgroundUrl;

  if (email !== undefined && email !== currentUser.email) {
    return changeEmail(currentUser, { ...data, email, ...(role ? { role } : {}) }, { password, credential, nonce }, db, deps);
  }

  if (role !== undefined && role !== currentUser.role) {
    if (currentUser.role === "ADMIN") {
      throw new AppError(403, "FORBIDDEN", "Rolul unui cont de administrator se schimbă numai din panoul de administrare.");
    }
    const updated = await db.$transaction(async (tx) => {
      const user = await tx.user.update({ where: { id: currentUser.id }, data: { ...data, role }, select: userSelect });
      if (role === "CLIENT") await tx.clientProfile.upsert({ where: { userId: currentUser.id }, create: { userId: currentUser.id }, update: {} });
      else await tx.freelancerProfile.upsert({ where: { userId: currentUser.id }, create: { userId: currentUser.id }, update: {} });
      return user;
    });
    return { user: updated, emailChanged: false };
  }

  if (Object.keys(data).length === 0) {
    return { user: await db.user.findUnique({ where: { id: currentUser.id }, select: userSelect }), emailChanged: false };
  }
  return { user: await updateProfileFields(currentUser.id, data, db), emailChanged: false };
}

module.exports = { updateMe };
