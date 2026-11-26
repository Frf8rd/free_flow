import api from './api.js';
import { config } from '../config.js';
import { compressImage, isAllowedImage } from '../lib/image.js';

// POST /uploads (multipart: file) -> { url }
export async function uploadImage(file, { purpose = 'portfolio', onProgress } = {}) {
  if (!isAllowedImage(file)) throw new Error('Alege o imagine JPG, PNG sau WebP.');
  if (file.size > 25 * 1024 * 1024) throw new Error('Imaginea este prea mare (maxim 25 MB).');
  const prepared = await compressImage(file, purpose === 'avatar' ? { maxSide: 640 } : { maxSide: 1600 });
  if (prepared.size > config.maxUploadMb * 1024 * 1024) throw new Error(`Imaginea depășește ${config.maxUploadMb} MB chiar și după comprimare.`);
  const form = new FormData();
  form.append('file', prepared);
  const { data } = await api.post('/uploads', form, {
    // Let the browser/Axios add the multipart boundary. A manually set
    // Content-Type can omit that boundary and make Multer reject the request.
    onUploadProgress: (e) => e.total && onProgress?.(Math.round((e.loaded / e.total) * 100)),
    timeout: 60000,
  });
  return data.url;
}
