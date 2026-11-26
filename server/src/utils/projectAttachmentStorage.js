const fs = require('node:fs/promises');
const path = require('node:path');
const cloudinary = require('./cloudinaryStorage');

const legacyDirectory = path.resolve(__dirname, '../../private-storage/project-attachments');

function cleanOriginalName(name) {
  return String(name || 'image')
    .replace(/\\/g, '/')
    .split('/')
    .pop()
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(0, 120) || 'image';
}

async function storeImage(buffer) {
  const storageKey = cloudinary.newKey();
  await cloudinary.upload('project-attachments', buffer, storageKey);
  return { storageKey };
}

function safeKey(key) {
  if (typeof key !== 'string' || !/^[a-f0-9-]{36}\.webp$/.test(key)) throw new Error('Invalid private attachment key.');
  return key;
}

function removeImage(key) {
  return cloudinary.remove('project-attachments', safeKey(key));
}

function imageUrl(key) {
  return cloudinary.imageUrl('project-attachments', safeKey(key));
}

async function readImage(key) {
  const safe = safeKey(key);
  try { return await cloudinary.read('project-attachments', safe); }
  catch (error) {
    try { return await fs.readFile(path.join(legacyDirectory, safe)); }
    catch (legacyError) {
      if (legacyError.code === 'ENOENT') throw error;
      throw legacyError;
    }
  }
}

module.exports = { cleanOriginalName, storeImage, removeImage, readImage, imageUrl };
