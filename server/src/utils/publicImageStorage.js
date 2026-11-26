const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

const directory = path.resolve(__dirname, '../../private-storage/profile-images');
function safeKey(key) {
  if (typeof key !== 'string' || !/^[a-f0-9-]{36}\.webp$/.test(key)) throw new Error('Invalid image key.');
  return path.join(directory, key);
}
async function save(buffer) {
  await fs.mkdir(directory, { recursive: true });
  const key = `${randomUUID()}.webp`;
  await fs.writeFile(safeKey(key), buffer, { flag: 'wx', mode: 0o600 });
  return key;
}
function read(key) { return fs.readFile(safeKey(key)); }

module.exports = { save, read };
