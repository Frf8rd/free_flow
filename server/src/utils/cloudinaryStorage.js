const { createHash, randomUUID } = require('node:crypto');
const { AppError } = require('./errors');

function getConfig() {
  const cloudName = (process.env.CLOUDINARY_CLOUD_NAME || '').trim();
  const apiKey = (process.env.CLOUDINARY_API_KEY || '').trim();
  const apiSecret = (process.env.CLOUDINARY_API_SECRET || '').trim();
  if (!cloudName || !apiKey || !apiSecret) {
    throw new AppError(503, 'CLOUDINARY_NOT_CONFIGURED', 'Stocarea Cloudinary nu este configurată pe server.');
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(cloudName)) {
    throw new AppError(503, 'CLOUDINARY_NOT_CONFIGURED', 'Numele Cloudinary cloud nu este valid.');
  }
  return { cloudName, apiKey, apiSecret };
}

function signature(params, apiSecret) {
  const payload = Object.keys(params).sort().map((key) => `${key}=${params[key]}`).join('&');
  return createHash('sha1').update(`${payload}${apiSecret}`).digest('hex');
}

function publicId(folder, key) {
  if (!['profile-images', 'project-attachments'].includes(folder)) throw new TypeError('Invalid Cloudinary folder.');
  if (typeof key !== 'string' || !/^[a-f0-9-]{36}\.webp$/.test(key)) throw new TypeError('Invalid image key.');
  return `fairmatch/${folder}/${key.slice(0, -5)}`;
}

function imageUrl(folder, key) {
  const { cloudName } = getConfig();
  const id = publicId(folder, key).split('/').map(encodeURIComponent).join('/');
  return `https://res.cloudinary.com/${cloudName}/image/upload/${id}.webp`;
}

async function upload(folder, buffer, key) {
  const config = getConfig();
  const id = publicId(folder, key);
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const params = { public_id: id, timestamp };
  const form = new FormData();
  form.append('file', new Blob([buffer], { type: 'image/webp' }), key);
  for (const [name, value] of Object.entries(params)) form.append(name, value);
  form.append('api_key', config.apiKey);
  form.append('signature', signature(params, config.apiSecret));

  let response;
  try {
    response = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`, {
      method: 'POST', body: form, signal: AbortSignal.timeout(30_000),
    });
  } catch (error) {
    const timeout = error?.name === 'TimeoutError' || error?.name === 'AbortError';
    throw new AppError(503, timeout ? 'CLOUDINARY_TIMEOUT' : 'CLOUDINARY_UNAVAILABLE', 'Nu s-a putut contacta Cloudinary.');
  }
  const result = await response.json().catch(() => null);
  if (!response.ok || result?.public_id !== id) {
    console.error('Cloudinary upload failed.', { status: response.status, code: result?.error?.http_code });
    throw new AppError(503, 'CLOUDINARY_UPLOAD_FAILED', 'Cloudinary nu a putut salva imaginea. Verifică setările și cheia API.');
  }
  return { publicId: id, url: result.secure_url };
}

async function read(folder, key) {
  const url = imageUrl(folder, key);
  let response;
  try { response = await fetch(url, { signal: AbortSignal.timeout(15_000) }); }
  catch {
    throw new AppError(503, 'CLOUDINARY_UNAVAILABLE', 'Nu s-a putut citi imaginea din Cloudinary.');
  }
  if (response.status === 404) {
    const error = new Error('Cloudinary image not found.');
    error.code = 'ENOENT';
    throw error;
  }
  if (!response.ok) throw new AppError(503, 'CLOUDINARY_READ_FAILED', 'Cloudinary nu a putut livra imaginea.');
  return Buffer.from(await response.arrayBuffer());
}

async function remove(folder, key) {
  const config = getConfig();
  const id = publicId(folder, key);
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const params = { public_id: id, timestamp };
  const form = new FormData();
  for (const [name, value] of Object.entries(params)) form.append(name, value);
  form.append('api_key', config.apiKey);
  form.append('signature', signature(params, config.apiSecret));
  let response;
  try {
    response = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudName}/image/destroy`, {
      method: 'POST', body: form, signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new AppError(503, 'CLOUDINARY_UNAVAILABLE', 'Nu s-a putut șterge imaginea din Cloudinary.');
  }
  const result = await response.json().catch(() => null);
  if (!response.ok || !['ok', 'not found'].includes(result?.result)) {
    throw new AppError(503, 'CLOUDINARY_DELETE_FAILED', 'Cloudinary nu a putut șterge imaginea.');
  }
}

async function migrateLocalImage(folder, key, buffer) {
  return upload(folder, buffer, key);
}

function newKey() { return `${randomUUID()}.webp`; }

module.exports = { getConfig, upload, read, remove, migrateLocalImage, newKey, imageUrl };
