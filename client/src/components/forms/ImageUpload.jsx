import { useRef, useState } from 'react';
import Icon from '../ui/Icon.jsx';
import { Avatar, Spinner } from '../ui/Kit.jsx';
import { uploadImage } from '../../services/uploads.js';
import { config } from '../../config.js';

// Încărcare imagine cu previzualizare, progres, validare și comprimare în browser.
// shape="round" pentru avatar, "wide" pentru portofoliu. onChange primește URL-ul întors de server.
export default function ImageUpload({ value, onChange, purpose = 'portfolio', shape = 'wide', name = '', label, disabled }) {
  const input = useRef(null);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState('');
  const busy = progress !== null;

  async function pick(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    setProgress(0);
    try { await onChange?.(await uploadImage(file, { purpose, onProgress: setProgress })); }
    catch (err) { setError(err.message || 'Încărcarea a eșuat. Încearcă din nou.'); }
    finally { setProgress(null); }
  }

  const trigger = (
    <button type="button" disabled={disabled || busy} onClick={() => input.current?.click()}
      className="inline-flex items-center gap-2 rounded-md border border-fm-graphite/25 px-4 py-2 text-sm font-semibold text-fm-ink transition hover:bg-fm-mist/50 disabled:opacity-60">
      {busy ? <Spinner className="h-4 w-4" /> : <Icon name={shape === 'round' ? 'camera' : 'upload'} className="h-4 w-4" />}
      {busy ? `Se încarcă ${progress}%` : value ? 'Schimbă imaginea' : label || 'Încarcă imagine'}
    </button>
  );

  return (
    <div>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={pick} aria-label={label || 'Încarcă imagine'} />
      {shape === 'round' ? (
        <div className="flex items-center gap-4">
          <Avatar name={name} src={value} size="h-20 w-20" />
          <div className="space-y-2">{trigger}{value && !busy && <button type="button" onClick={() => onChange('')} className="ml-2 text-sm font-medium text-fm-slate/70 hover:text-red-500">Elimină</button>}</div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-dashed border-fm-graphite/30">
          {value ? <img src={value} alt="Previzualizare" className="aspect-video w-full object-cover" /> : (
            <button type="button" disabled={disabled || busy} onClick={() => input.current?.click()} className="grid aspect-video w-full place-items-center bg-fm-mist/30 text-fm-slate/60 transition hover:bg-fm-mist/50">
              <span className="text-center"><Icon name="image" className="mx-auto h-8 w-8" /><span className="mt-2 block text-sm font-medium">Adaugă o imagine</span></span>
            </button>
          )}
          <div className="flex items-center gap-3 bg-white p-3">{trigger}{value && !busy && <button type="button" onClick={() => onChange('')} className="text-sm font-medium text-fm-slate/70 hover:text-red-500">Elimină</button>}</div>
        </div>
      )}
      <p className="mt-1.5 text-xs text-fm-slate/60">JPG, PNG sau WebP · maxim {config.maxUploadMb} MB (comprimăm automat)</p>
      {error && <p role="alert" className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
