const fs = require('node:fs/promises');
const path = require('node:path');
const cloudinary = require('./cloudinaryStorage');

const legacyDirectory = path.resolve(__dirname, '../../private-storage/profile-images');

function safeKey(key) {
  if (typeof key !== 'string' || !/^[a-f0-9-]{36}\.webp$/.test(key)) throw new Error('Invalid image key.');
  return key;
}

async function save(buffer) {
  const key = cloudinary.newKey();
  const uploaded = await cloudinary.upload('profile-images', buffer, key);
  return { key, url: uploaded.url };
}

async function read(key) {
  const safe = safeKey(key);
  try { return await cloudinary.read('profile-images', safe); }
  catch (error) {
    try { return await fs.readFile(path.join(legacyDirectory, safe)); }
    catch (legacyError) {
      if (legacyError.code === 'ENOENT') throw error;
      throw legacyError;
    }
  }
}

function remove(key) {
  return cloudinary.remove('profile-images', safeKey(key));
}

module.exports = { save, read, remove };
