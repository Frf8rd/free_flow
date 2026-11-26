// Comprimă imaginea în browser înainte de upload: mai puțin trafic, încărcare rapidă, fără surprize de dimensiune.
const TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const isAllowedImage = (f) => TYPES.includes(f.type);

function load(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Imaginea nu poate fi citită.')); };
    img.src = url;
  });
}

export async function compressImage(file, { maxSide = 1600, quality = 0.86 } = {}) {
  try {
    const img = await load(file);
    const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
    const w = Math.round(img.width * scale), h = Math.round(img.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, w, h);
    const blob = await new Promise((res) => canvas.toBlob(res, 'image/webp', quality));
    if (!blob || blob.size >= file.size) return file.size > 0 && scale === 1 ? file : (blob || file);
    return new File([blob], file.name.replace(/\.\w+$/, '') + '.webp', { type: 'image/webp' });
  } catch {
    return file; // în mediile fără canvas se trimite originalul; serverul validează oricum
  }
}
