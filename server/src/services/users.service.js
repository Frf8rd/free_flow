const prisma = require("../config/prisma");
const { AppError } = require("../utils/errors");
const { userPatchSchema, parse } = require("../validators/users.validator");

const userSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  avatarUrl: true,
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

  let updated;
  try {
    [updated] = await db.$transaction([
      db.user.update({
        where: { id: current.id },
        data: { ...data, emailVerifiedAt: null, tokenVersion: { increment: 1 } },
        select: userSelect,
      }),
      db.refreshToken.updateMany({
        where: { userId: current.id, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
  } catch (error) {
    if (error && error.code === "P2002") {
      throw new AppError(409, "EMAIL_IN_USE", "Această adresă de email este deja înregistrată.");
    }
    throw error;
  }

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
  const { email, password, credential, nonce, ...profile } = parse(userPatchSchema, input);

  const data = {};
  if (profile.name !== undefined) data.name = profile.name;
  if (profile.avatarUrl !== undefined) data.avatarUrl = profile.avatarUrl;

  if (email !== undefined && email !== currentUser.email) {
    return changeEmail(currentUser, { ...data, email }, { password, credential, nonce }, db, deps);
  }
  if (Object.keys(data).length === 0) {
    return { user: await db.user.findUnique({ where: { id: currentUser.id }, select: userSelect }), emailChanged: false };
  }
  return { user: await updateProfileFields(currentUser.id, data, db), emailChanged: false };
}

module.exports = { updateMe };