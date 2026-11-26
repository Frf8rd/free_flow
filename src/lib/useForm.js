import { useCallback, useState } from 'react';
import { validate } from './validators.js';

// Formular minimal: valori + erori pe câmp (client: Zod; server: ApiError.details) + stare de trimitere.
export default function useForm(schema, initial) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const set = useCallback((k, v) => { setValues((s) => ({ ...s, [k]: v })); setErrors((e) => (e[k] ? { ...e, [k]: '' } : e)); }, []);
  const bind = (k) => ({ value: values[k] ?? '', onChange: (e) => set(k, e.target.value) });

  // submit(onValid) => handler pentru onSubmit; onValid primește datele validate
  const submit = (onValid) => async (e) => {
    e?.preventDefault?.();
    setFormError('');
    const { data, errors: er } = validate(schema, values);
    setErrors(er);
    if (!data) return;
    setSubmitting(true);
    try { await onValid(data); } catch (err) {
      if (err.details) setErrors((x) => ({ ...x, ...err.details }));
      setFormError(err.message || 'Ceva nu a mers. Încearcă din nou.');
    } finally { setSubmitting(false); }
  };

  return { values, setValues, set, bind, errors, formError, setFormError, submitting, submit, reset: () => { setValues(initial); setErrors({}); setFormError(''); } };
}
