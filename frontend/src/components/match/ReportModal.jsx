import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import { Field, Textarea } from '../ui/Fields.jsx';
import { Notice } from '../ui/Kit.jsx';
import useForm from '../../lib/useForm.js';
import { reportSchema } from '../../lib/validators.js';
import { useReport } from '../../hooks/queries.js';
import { useToast } from '../feedback/Toast.jsx';

// Raportare abuz (README: POST /reports { targetType: USER | PROJECT | MESSAGE, targetId, reason })
export default function ReportModal({ open, onClose, targetType, targetId, subject }) {
  const f = useForm(reportSchema, { reason: '' });
  const report = useReport();
  const { toast } = useToast();
  const close = () => { f.reset(); onClose(); };
  const onSubmit = f.submit(async (d) => { await report.mutateAsync({ targetType, targetId, reason: d.reason }); toast('Mulțumim. Raportarea a fost trimisă echipei de moderare.'); close(); });
  return (
    <Modal open={open} onClose={close} title={`Raportează ${subject || ''}`.trim()}>
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {f.formError && <Notice tone="danger" icon="alert">{f.formError}</Notice>}
        <Field label="Ce s-a întâmplat?" error={f.errors.reason} hint="Descrie pe scurt problema. Raportarea e confidențială."><Textarea rows={4} maxLength={1000} placeholder="Ex.: mi-a cerut să plătesc în afara platformei…" error={f.errors.reason} {...f.bind('reason')} /></Field>
        <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={close}>Renunță</Button><Button type="submit" loading={f.submitting}>Trimite raportarea</Button></div>
      </form>
    </Modal>
  );
}
