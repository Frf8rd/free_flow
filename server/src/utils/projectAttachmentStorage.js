const fs = require("node:fs/promises");
const path = require("node:path");
const { randomUUID } = require("node:crypto");

const storageDirectory = path.resolve(__dirname, "../../private-storage/project-attachments");

function cleanOriginalName(name) {
  return path.basename(String(name || "image"))
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 120) || "image";
}

async function storeImage(buffer) {
  await fs.mkdir(storageDirectory, { recursive: true });
  const storageKey = `${randomUUID()}.webp`;
  const fullPath = path.join(storageDirectory, storageKey);
  await fs.writeFile(fullPath, buffer, { flag: "wx", mode: 0o600 });
  return { storageKey, fullPath };
}

function getPath(storageKey) {
  if (typeof storageKey !== "string" || !/^[a-f0-9-]{36}\.webp$/.test(storageKey)) {
    throw new Error("Invalid private attachment key.");
  }
  return path.join(storageDirectory, storageKey);
}

async function removeImage(storageKey) {
  try { await fs.unlink(getPath(storageKey)); }
  catch (error) { if (error.code !== "ENOENT") throw error; }
}

async function readImage(storageKey) {
  return fs.readFile(getPath(storageKey));
}

module.exports = { cleanOriginalName, storeImage, removeImage, readImage };
