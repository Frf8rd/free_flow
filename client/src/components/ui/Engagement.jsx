import { useState } from 'react';
import Icon from './Icon.jsx';
import Button from './Button.jsx';
import { Textarea } from './Fields.jsx';

const steps = ['În lucru', 'Livrat', 'Finalizat'];
const order = { IN_PROGRESS: 0, DELIVERED: 1, COMPLETED: 2, CANCELLED: 0 };
export const statusLabel = { IN_PROGRESS: 'În lucru', DELIVERED: 'Livrat', COMPLETED: 'Finalizat', CANCELLED: 'Anulat' };

export function Stepper({ status }) {
  const cur = order[status];
  return (
    <ol className="flex items-center gap-2" aria-label="Stadiul colaborării">
      {steps.map((s, i) => (
        <li key={s} className="flex flex-1 items-center gap-2 last:flex-none">
          <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold ${i <= cur ? 'bg-fm-ink text-white' : 'bg-fm-mist text-fm-slate/60'}`}>{i < cur || status === 'COMPLETED' ? <Icon name="check" className="h-3.5 w-3.5" /> : i + 1}</span>
          <span className={`hidden text-xs font-semibold sm:inline ${i <= cur ? 'text-fm-ink' : 'text-fm-slate/55'}`}>{s}</span>
          {i < steps.length - 1 && <span className={`h-px flex-1 ${i < cur ? 'bg-fm-ink' : 'bg-fm-graphite/20'}`} />}
        </li>))}
    </ol>
  );
}

// README: recenzia (1–5 + comentariu) se poate lăsa doar după COMPLETED și o singură dată per participant
export function ReviewForm({ onSave }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  return (
    <div className="mt-4 grid gap-3 rounded-md bg-fm-snow p-3">
      <div className="flex items-center gap-1" role="radiogroup" aria-label="Notă">
        {[1, 2, 3, 4, 5].map((n) => <button key={n} type="button" role="radio" aria-checked={rating === n} onClick={() => setRating(n)} aria-label={`${n} stele`} className="p-0.5"><Icon name="star" fill={n <= rating} className={`h-6 w-6 ${n <= rating ? 'text-amber-500' : 'text-fm-steel'}`} /></button>)}
      </div>
      <Textarea rows={2} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Comentariu (opțional)" aria-label="Comentariu" maxLength={1000} />
      <div className="flex justify-end"><Button disabled={!rating} onClick={() => onSave({ rating, comment })} className="py-2">Trimite recenzia</Button></div>
    </div>
  );
}
