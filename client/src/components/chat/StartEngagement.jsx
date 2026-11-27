import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../ui/Button.jsx';
import Modal from '../ui/Modal.jsx';
import { Field, Text } from '../ui/Fields.jsx';
import { useToast } from '../feedback/Toast.jsx';
import { useAuth } from '../../store/authStore.js';
import { useCreateEngagement } from '../../hooks/queries.js';
import { config } from '../../config.js';

export default function StartEngagement({ conversation }) {
  const [open, setOpen] = useState(false);
  const [price, setPrice] = useState('');
  const [deadline, setDeadline] = useState('');
  const user = useAuth((state) => state.user);
  const create = useCreateEngagement();
  const navigate = useNavigate();
  const { toast, error } = useToast();

  if (conversation.proposalId) return <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => navigate(`/engagements/${conversation.proposalId}`)}>Vezi propunerea</Button>;
  if (conversation.engagementId) return <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => navigate(`/engagements/${conversation.engagementId}`)}>Vezi colaborarea</Button>;
  if (user?.role !== 'FREELANCER' || conversation.freelancerId !== user.id || !conversation.matchId || conversation.matchStatus !== 'ACCEPTED' || (conversation.project?.status && conversation.project.status !== 'OPEN')) return null;

  const submit = async (event) => {
    event.preventDefault();
    const agreedPrice = Number(price);
    if (!Number.isSafeInteger(agreedPrice) || agreedPrice <= 0) return error(new Error('Introdu o sumă întreagă, mai mare decât zero.'));
    try {
      const result = await create.mutateAsync({ matchId: conversation.matchId, agreedPrice, ...(deadline ? { deadline } : {}) });
      const engagement = result?.engagement || result?.data || result;
      setOpen(false);
      toast('Propunerea a fost trimisă clientului.');
      if (engagement?.id) navigate(`/engagements/${engagement.id}`);
      else navigate('/engagements');
    } catch (e) { error(e); }
  };

  return <>
    <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => setOpen(true)}>Propune colaborarea</Button>
    <Modal open={open} onClose={() => setOpen(false)} title="Propune colaborarea" footer={<><Button variant="outline" onClick={() => setOpen(false)}>Renunță</Button><Button type="submit" form="start-engagement-form" loading={create.isPending}>Trimite propunerea</Button></>}>
      <form id="start-engagement-form" onSubmit={submit} className="grid gap-4">
        <p className="text-sm leading-6 text-fm-slate/70">Introdu suma și termenul discutate. Colaborarea începe după ce clientul acceptă propunerea.</p>
        <Field label={`Sumă convenită (${config.currency})`}><Text required type="number" min="1" step="1" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="ex. 500" /></Field>
        <Field label="Termen" optional><Text type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} /></Field>
      </form>
    </Modal>
  </>;
}
