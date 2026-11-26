require('dotenv').config();

const fs = require('node:fs/promises');
const path = require('node:path');
const cloudinary = require('../src/utils/cloudinaryStorage');

async function migrateDirectory(directory, folder) {
  let names;
  try { names = await fs.readdir(directory); }
  catch (error) { if (error.code === 'ENOENT') return 0; throw error; }
  let migrated = 0;
  for (const name of names) {
    if (!/^[a-f0-9-]{36}\.webp$/.test(name)) continue;
    const buffer = await fs.readFile(path.join(directory, name));
    await cloudinary.migrateLocalImage(folder, name, buffer);
    migrated += 1;
    console.log(`Uploaded ${folder}/${name}`);
  }
  return migrated;
}

async function main() {
  cloudinary.getConfig();
  const base = path.resolve(__dirname, '../private-storage');
  const profiles = await migrateDirectory(path.join(base, 'profile-images'), 'profile-images');
  const attachments = await migrateDirectory(path.join(base, 'project-attachments'), 'project-attachments');
  console.log(`Cloudinary migration complete: ${profiles} profile images, ${attachments} project attachments.`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
