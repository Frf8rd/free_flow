const sharp = require("sharp");
const prisma = require("../config/prisma");
const { AppError } = require("../utils/errors");
const cloudmersive = require("../utils/cloudmersive");
const storage = require("../utils/projectAttachmentStorage");

const MAX_ATTACHMENTS = 8;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_FORMATS = new Set(["jpeg", "png", "webp"]);

async function findProject(projectId, db = prisma) {
  const project = await db.project.findUnique({ where: { id: projectId }, select: { id: true, clientId: true, status: true } });
  if (!project) throw new AppError(404, "PROJECT_NOT_FOUND", "Proiectul nu a fost găsit.");
  return project;
}

async function assertCanView(user, project, db = prisma) {
  if (project.clientId === user.id || project.status === "OPEN") return;
  const acceptedEngagement = await db.engagement.findFirst({
    where: {
      projectId: project.id,
      status: { in: ["IN_PROGRESS", "DELIVERED", "COMPLETED"] },
      OR: [{ clientId: user.id }, { freelancerId: user.id }],
    },
    select: { id: true },
  });
  if (!acceptedEngagement) throw new AppError(403, "FORBIDDEN", "Nu ai acces la atașamentele acestui proiect.");
}

async function listAttachments(user, projectId, db = prisma) {
  const project = await findProject(projectId, db);
  await assertCanView(user, project, db);
  const attachments = await db.projectAttachment.findMany({
    where: { projectId },
    select: { id: true, projectId: true, storageKey: true, mimeType: true, sizeBytes: true, originalName: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  return attachments.map(({ storageKey, ...attachment }) => ({ ...attachment, url: storage.imageUrl(storageKey) }));
}

async function uploadAttachment(userId, projectId, file, db = prisma) {
  if (!file?.buffer || !Buffer.isBuffer(file.buffer)) throw new AppError(400, "IMAGE_REQUIRED", "Selectează o imagine pentru încărcare.");
  if (file.size > MAX_IMAGE_BYTES) throw new AppError(413, "IMAGE_TOO_LARGE", "Imaginea trebuie să aibă maximum 5 MB.");
  const project = await findProject(projectId, db);
  if (project.clientId !== userId) throw new AppError(403, "FORBIDDEN", "Doar clientul proprietar poate adăuga imagini la proiect.");

  const count = await db.projectAttachment.count({ where: { projectId } });
  if (count >= MAX_ATTACHMENTS) throw new AppError(409, "ATTACHMENT_LIMIT", "Un proiect poate avea maximum 8 imagini.");
  const originalName = storage.cleanOriginalName(file.originalname);
  await cloudmersive.scanBuffer(file.buffer, originalName);

  let metadata;
  let sanitized;
  try {
    const image = sharp(file.buffer, { limitInputPixels: 40_000_000, failOn: "error" });
    metadata = await image.metadata();
    if (!ALLOWED_FORMATS.has(metadata.format) || !metadata.width || !metadata.height) {
      throw new AppError(415, "UNSUPPORTED_IMAGE", "Sunt acceptate doar imagini JPEG, PNG sau WebP valide.");
    }
    sanitized = await sharp(file.buffer, { limitInputPixels: 40_000_000, failOn: "error" })
      .rotate()
      .resize({ width: 4096, height: 4096, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 84, effort: 4 })
      .toBuffer();
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(415, "INVALID_IMAGE", "Fișierul nu poate fi decodat ca imagine validă.");
  }

  if (sanitized.length > MAX_IMAGE_BYTES) throw new AppError(413, "IMAGE_TOO_LARGE", "Imaginea optimizată depășește limita de 5 MB.");

  const saved = await storage.storeImage(sanitized);
  try {
    const attachment = await db.projectAttachment.create({
      data: {
        projectId,
        uploaderId: userId,
        storageKey: saved.storageKey,
        mimeType: "image/webp",
        sizeBytes: sanitized.length,
        originalName,
      },
      select: { id: true, projectId: true, storageKey: true, mimeType: true, sizeBytes: true, originalName: true, createdAt: true },
    });
    return { ...attachment, url: storage.imageUrl(attachment.storageKey) };
  } catch (error) {
    await storage.removeImage(saved.storageKey).catch(() => {});
    throw error;
  }
}

async function getAttachment(user, projectId, attachmentId, db = prisma) {
  const project = await findProject(projectId, db);
  await assertCanView(user, project, db);
  const attachment = await db.projectAttachment.findFirst({
    where: { id: attachmentId, projectId },
    select: { id: true, storageKey: true, mimeType: true, originalName: true },
  });
  if (!attachment) throw new AppError(404, "ATTACHMENT_NOT_FOUND", "Imaginea nu a fost găsită.");
  return { ...attachment, buffer: await storage.readImage(attachment.storageKey) };
}

async function deleteAttachment(userId, projectId, attachmentId, db = prisma) {
  const project = await findProject(projectId, db);
  if (project.clientId !== userId) throw new AppError(403, "FORBIDDEN", "Doar clientul proprietar poate șterge imaginile proiectului.");
  const attachment = await db.projectAttachment.findFirst({ where: { id: attachmentId, projectId }, select: { id: true, storageKey: true } });
  if (!attachment) throw new AppError(404, "ATTACHMENT_NOT_FOUND", "Imaginea nu a fost găsită.");
  await db.projectAttachment.delete({ where: { id: attachment.id } });
  await storage.removeImage(attachment.storageKey).catch((error) => {
    console.error("Private project image cleanup failed.", { code: error.code || "UNKNOWN" });
  });
}

module.exports = { listAttachments, uploadAttachment, getAttachment, deleteAttachment };
