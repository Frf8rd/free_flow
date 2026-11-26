import { useEffect, useState } from 'react';
import Icon from '../ui/Icon.jsx';

export default function ProjectImages({ images, image, title, className = '', imageClassName = '', showControls = true }) {
  const items = (Array.isArray(images) && images.length ? images : image ? [image] : []).filter(Boolean);
  const [index, setIndex] = useState(0);
  const imageKey = items.join('|');

  useEffect(() => setIndex((current) => Math.min(current, Math.max(0, items.length - 1))), [imageKey]);
  if (!items.length) return null;

  const move = (direction) => setIndex((current) => (current + direction + items.length) % items.length);

  return (
    <div className={`group relative min-w-0 overflow-hidden ${className}`} aria-label={`Imagini pentru proiectul ${title}`}>
      <img src={items[index]} alt={`${title} — imaginea ${index + 1} din ${items.length}`} className={`block h-full w-full object-cover ${imageClassName}`} />
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
