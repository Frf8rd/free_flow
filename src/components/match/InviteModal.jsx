import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import { Notice, Skeleton } from '../ui/Kit.jsx';
import { useInviteManual, useMyProjects } from '../../hooks/queries.js';
import { useToast } from '../feedback/Toast.jsx';
import { formatBudget } from '../../lib/format.js';

// Invitație către un freelancer găsit manual (POST /matches/invite)
export default function InviteModal({ open, onClose, freelancer }) {
  const projects = useMyProjects(open);
  const invite = useInviteManual();
  const nav = useNavigate();
  const { toast, error } = useToast();
  const [pid, setPid] = useState('');
  const open_ = (projects.data || []).filter((p) => p.status === 'OPEN');
  const sel = pid || open_[0]?.id || '';

  const go = async () => {
    try { const r = await invite.mutateAsync({ projectId: sel, freelancerId: freelancer.id }); toast(`L-ai invitat pe ${freelancer.name}.`); onClose(); nav(`/messages?c=${r.conversationId}`); }
    catch (e) { error(e); }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Invită-l pe ${freelancer?.name || ''}`}>
      {projects.isPending ? <Skeleton className="h-24 w-full" /> : open_.length === 0 ? (
        <Notice tone="info" icon="info">Ca să inviți pe cineva ai nevoie de un proiect deschis. <Link to="/projects/new" className="font-semibold text-fm-accent underline">Postează unul</Link> în câteva minute.</Notice>
      ) : (
        <>
          <p className="mb-3 text-sm text-fm-slate/75">Alege proiectul la care îl inviți. Se va deschide o discuție.</p>
          <div className="space-y-2">
            {open_.map((p) => (
              <label key={p.id} className={`flex cursor-pointer items-center gap-3 rounded-md border p-3 ${sel === p.id ? 'border-fm-accent-solid bg-fm-accent-solid/8' : 'border-fm-graphite/15'}`}>
                <input type="radio" name="project" checked={sel === p.id} onChange={() => setPid(p.id)} className="accent-[rgb(var(--fm-accent-solid))]" />
                <span className="min-w-0"><span className="block truncate text-sm font-semibold text-fm-ink">{p.title}</span><span className="text-xs text-fm-slate/60">{formatBudget(p.budgetMin, p.budgetMax)}</span></span>
              </label>
            ))}
          </div>
          <div className="mt-5 flex justify-end gap-2"><Button variant="outline" onClick={onClose}>Renunță</Button><Button loading={invite.isPending} onClick={go}>Trimite invitația</Button></div>
        </>
      )}
    </Modal>
  );
}
