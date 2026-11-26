import { useEffect, useState } from 'react';
import api from '../../services/api.js';
import Icon from '../ui/Icon.jsx';

export default function ProjectImages({ images, image, title, className = '', imageClassName = '', showControls = true }) {
  const items = (Array.isArray(images) && images.length ? images : image ? [image] : []).filter(Boolean);
  const [index, setIndex] = useState(0);
  const [source, setSource] = useState('');
  const [imageState, setImageState] = useState('loading');
  const imageKey = items.join('|');

  useEffect(() => setIndex((current) => Math.min(current, Math.max(0, items.length - 1))), [imageKey]);
  useEffect(() => {
    let active = true;
    let objectUrl = '';
    const item = items[index];
    if (!item) { setSource(''); setImageState('error'); return undefined; }
    if (!item.startsWith('/projects/')) { setSource(item); setImageState('loaded'); return undefined; }
    setSource('');
    setImageState('loading');
    api.get(item, { responseType: 'blob' }).then(({ data }) => {
      objectUrl = URL.createObjectURL(data);
      if (active) { setSource(objectUrl); setImageState('loaded'); }
      else URL.revokeObjectURL(objectUrl);
    }).catch(() => { if (active) { setSource(''); setImageState('error'); } });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [items[index]]);
  if (!items.length) return null;

  const move = (direction) => setIndex((current) => (current + direction + items.length) % items.length);

  return (
    <div className={`group relative min-w-0 overflow-hidden ${className}`} aria-label={`Imagini pentru proiectul ${title}`}>
      {source ? <img src={source} alt={`${title} — imaginea ${index + 1} din ${items.length}`} className={`block h-full w-full object-cover ${imageClassName}`} /> : <div className="grid h-full w-full place-items-center bg-fm-mist/30 text-fm-slate/55" role={imageState === 'loading' ? 'status' : undefined} aria-label={imageState === 'loading' ? 'Se încarcă imaginea' : 'Imagine indisponibilă'}><Icon name="image" className="h-6 w-6" /></div>}
      {items.length > 1 && showControls && <>
        <button type="button" onClick={() => move(-1)} aria-label="Imaginea anterioară" className="absolute left-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center bg-black/60 text-white shadow hover:bg-black/80">
          <Icon name="chevronLeft" className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => move(1)} aria-label="Imaginea următoare" className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center bg-black/60 text-white shadow hover:bg-black/80">
          <Icon name="chevronRight" className="h-4 w-4" />
        </button>
        <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1.5 bg-black/45 px-2 py-1">
          {items.map((src, dot) => <button key={`${src}-${dot}`} type="button" onClick={() => setIndex(dot)} aria-label={`Afișează imaginea ${dot + 1}`} aria-current={dot === index} className={`h-1.5 w-1.5 ${dot === index ? 'bg-white' : 'bg-white/50'}`} />)}
        </div>
      </>}
    </div>
  );
}
