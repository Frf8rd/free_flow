import { useState } from 'react';
import Icon from './Icon.jsx';
import Button from './Button.jsx';
import { Textarea } from './Fields.jsx';
import { report } from '../../services/reviews.js';

// README 5.4: POST /reports { targetType, targetId, reason } — utilizator / proiect / mesaj
export default function ReportButton({ targetType, targetId, label = 'Raportează' }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  async function send() {
    if (reason.trim().length < 5) return setError('Spune pe scurt ce nu e în regulă.');
    try { await report({ targetType, targetId, reason: reason.trim() }); setSent(true); }
    catch (e) { setError(e.message); }
  }
  if (sent) return <p role="status" className="flex items-center gap-1.5 text-xs font-semibold text-fm-slate/70"><Icon name="check" className="h-3.5 w-3.5" /> Raportarea a ajuns la moderare.</p>;
  if (!open) return <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 text-xs font-semibold text-fm-slate/60 hover:text-fm-ink"><Icon name="flag" className="h-3.5 w-3.5" />{label}</button>;
  return (
    <div className="grid gap-2 rounded-md border border-fm-ink/10 bg-fm-snow p-3">
      <Textarea rows={2} value={reason} onChange={(e) => { setReason(e.target.value); setError(''); }} placeholder="Motivul raportării" aria-label="Motivul raportării" maxLength={500} />
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setOpen(false)} className="py-1.5 text-xs">Anulează</Button><Button onClick={send} className="py-1.5 text-xs">Trimite</Button></div>
    </div>
  );
}
