import { useEffect, useState } from 'react';
import Icon from '../ui/Icon.jsx';

export default function ProjectImagePicker({ files, onChange, error }) {
  const [previews, setPreviews] = useState([]);
  useEffect(() => {
    const next = files.map((file) => ({ file, url: URL.createObjectURL(file) }));
    setPreviews(next);
    return () => next.forEach(({ url }) => URL.revokeObjectURL(url));
  }, [files]);

  const add = (event) => {
    const selected = Array.from(event.target.files || []);
    event.target.value = '';
    onChange([...files, ...selected].slice(0, 8));
  };

  return <div>
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-sm font-medium text-fm-ink">Imagini proiect <span className="text-xs font-normal text-fm-slate/60">opțional · maximum 8</span></p>
        <p className="mt-1 text-xs text-fm-slate/65">JPG, PNG sau WebP · maximum 5 MB fiecare</p>
      </div>
      <label className="inline-flex cursor-pointer items-center gap-2 border border-fm-graphite/25 px-3 py-2 text-sm font-semibold text-fm-ink hover:bg-fm-mist/50">
        <Icon name="image" className="h-4 w-4" /> Alege imagini
        <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={add} disabled={files.length >= 8} />
      </label>
    </div>
    {error && <p role="alert" className="mt-2 text-xs text-red-600">{error}</p>}
    {previews.length > 0 && <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
      {previews.map(({ file, url }, index) => <div key={`${file.name}-${file.lastModified}-${index}`} className="group relative aspect-[4/3] overflow-hidden bg-fm-mist">
        <img src={url} alt={file.name} className="h-full w-full object-cover" />
        <button type="button" onClick={() => onChange(files.filter((_, i) => i !== index))} aria-label={`Șterge ${file.name}`} className="absolute right-1 top-1 grid h-7 w-7 place-items-center bg-black/65 text-white opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
          <Icon name="close" className="h-4 w-4" />
        </button>
        <span className="absolute inset-x-0 bottom-0 truncate bg-black/55 px-2 py-1 text-xs text-white">{file.name}</span>
      </div>)}
    </div>}
  </div>;
}
