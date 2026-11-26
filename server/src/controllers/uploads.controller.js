const sharp = require('sharp');
const storage = require('../utils/publicImageStorage');
const cloudmersive = require('../utils/cloudmersive');
const { AppError } = require('../utils/errors');

async function create(req, res) {
  if (!req.file?.buffer) throw new AppError(400, 'VALIDATION_ERROR', 'Imaginea lipsește.');
  const extension = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[req.file.mimetype];
  await cloudmersive.scanBuffer(req.file.buffer, `profile-image.${extension}`);
  let image;
  try {
    image = await sharp(req.file.buffer, { limitInputPixels: 25_000_000 }).rotate().webp({ quality: 84 }).toBuffer();
  } catch {
    throw new AppError(415, 'INVALID_IMAGE', 'Fișierul încărcat nu este o imagine validă.');
  }
  const key = await storage.save(image);
  // În spatele proxy-ului Render, req.protocol este "http"; URL-ul salvat trebuie să fie https.
  const configured = (process.env.PUBLIC_API_URL || '').replace(/\/+$/, '');
  const base = configured
    || (process.env.NODE_ENV === 'production' ? `https://${req.get('host')}` : `${req.protocol}://${req.get('host')}`);
  res.status(201).json({ url: `${base}/api/uploads/${key}` });
}

async function read(req, res) {
  try {
    const image = await storage.read(req.params.key);
    res.set({ 'Content-Type': 'image/webp', 'Cache-Control': 'public, max-age=31536000, immutable' }).send(image);
  } catch (error) {
    if (error.code === 'ENOENT' || error.message === 'Invalid image key.') throw new AppError(404, 'UPLOAD_NOT_FOUND', 'Imaginea nu a fost găsită.');
    throw error;
  }
}

module.exports = { create, read };