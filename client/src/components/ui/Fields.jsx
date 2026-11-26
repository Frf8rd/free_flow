import { useEffect, useId, useRef, useState } from 'react';
import Icon from './Icon.jsx';

const base = 'w-full rounded-md border border-fm-graphite/15 bg-white px-4 py-3 text-sm text-fm-ink placeholder:text-fm-slate/45 transition focus:border-fm-graphite focus:outline-none focus:ring-2 focus:ring-fm-graphite/30';

export const Field = ({ label, hint, error, className = '', children }) => (
  <label className={`block ${className}`}>
    <span className="mb-1.5 block text-sm font-medium text-fm-ink">{label}</span>
    {children}
    {error ? <span className="mt-1 block text-xs text-red-500">{error}</span> : hint && <span className="mt-1 block text-xs text-fm-slate/60">{hint}</span>}
  </label>
);
export const Text = (p) => <input {...p} className={base} />;
export const Textarea = ({ rows = 4, ...p }) => <textarea rows={rows} {...p} className={`${base} resize-none`} />;
export function Select({ options = [], value, onChange, className = '', disabled = false, ...props }) {
  const rootRef = useRef(null);
  const listRef = useRef(null);
  const listId = useId();
  const [open, setOpen] = useState(false);
  const entries = options.map((option) => typeof option === 'object'
    ? { value: option.value, label: option.label }
    : { value: option, label: option });
  const selectedIndex = Math.max(0, entries.findIndex((entry) => String(entry.value) === String(value)));
  const [activeIndex, setActiveIndex] = useState(selectedIndex);
  const selected = entries[selectedIndex];

  useEffect(() => { if (open) listRef.current?.querySelector(`[data-option-index="${activeIndex}"]`)?.focus(); }, [open, activeIndex]);
  useEffect(() => {
    if (!open) return undefined;
    const outside = (event) => { if (!rootRef.current?.contains(event.target)) setOpen(false); };
    const escape = (event) => { if (event.key === 'Escape') { setOpen(false); rootRef.current?.querySelector('button[aria-haspopup="listbox"]')?.focus(); } };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
  }, [open]);

  const choose = (entry) => {
    onChange?.({ target: { value: entry.value }, currentTarget: { value: entry.value } });
    setOpen(false);
    rootRef.current?.querySelector('button[aria-haspopup="listbox"]')?.focus();
  };
  const openAt = (index = selectedIndex) => { setActiveIndex(index); setOpen(true); };
  const onTriggerKeyDown = (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); openAt(selectedIndex); }
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open ? setOpen(false) : openAt(selectedIndex); }
  };
  const onListKeyDown = (event) => {
    let next = activeIndex;
    if (event.key === 'ArrowDown') next = Math.min(entries.length - 1, activeIndex + 1);
    else if (event.key === 'ArrowUp') next = Math.max(0, activeIndex - 1);
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = entries.length - 1;
    else return;
    event.preventDefault();
    setActiveIndex(next);
    listRef.current?.querySelector(`[data-option-index="${next}"]`)?.focus();
  };

  return (
    <div ref={rootRef} className="relative w-full">
      <button {...props} type="button" disabled={disabled} aria-haspopup="listbox" aria-expanded={open} aria-controls={listId} onKeyDown={onTriggerKeyDown} onClick={() => open ? setOpen(false) : openAt(selectedIndex)} className={`${base} flex min-h-[46px] items-center justify-between gap-3 text-left disabled:cursor-not-allowed disabled:opacity-50 ${className}`}>
        <span className="min-w-0 truncate">{selected?.label ?? 'Alege o opțiune'}</span>
        <Icon name="chevron" className={`h-4 w-4 shrink-0 text-fm-slate/60 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div id={listId} ref={listRef} role="listbox" aria-label={props['aria-label']} onKeyDown={onListKeyDown} className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto border border-fm-ink/15 bg-fm-page p-1 shadow-xl">
        {entries.map((entry, index) => <button key={`${entry.value}-${index}`} type="button" role="option" aria-selected={String(entry.value) === String(selected?.value)} data-option-index={index} onClick={() => choose(entry)} className={`flex min-h-10 w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors ${String(entry.value) === String(selected?.value) ? 'bg-fm-mist/70 font-semibold text-fm-ink' : 'text-fm-slate hover:bg-fm-mist/45 hover:text-fm-ink'} focus:bg-fm-mist/60 focus:outline-none`}>
          <span className="min-w-0 truncate">{entry.label}</span>
          {String(entry.value) === String(selected?.value) && <Icon name="check" className="h-4 w-4 shrink-0 text-fm-graphite" />}
        </button>)}
      </div>}
    </div>
  );
}

export function SkillPicker({ options, value, onChange }) {
  const toggle = (s) => onChange(value.includes(s) ? value.filter((x) => x !== s) : [...value, s]);
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((s) => (
        <button type="button" key={s} onClick={() => toggle(s)} aria-pressed={value.includes(s)}
          className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${value.includes(s) ? 'bg-fm-ink text-white' : 'bg-fm-mist/70 text-fm-ink hover:bg-fm-mist'}`}>{s}</button>
      ))}
    </div>
  );
}

export function ChipPicker({ options = [], value, onChange, multiple = true }) {
  const selected = Array.isArray(value) ? value : value ? [value] : [];
  const toggle = (item) => {
    const next = selected.includes(item) ? selected.filter((x) => x !== item) : multiple ? [...selected, item] : [item];
    onChange?.(multiple ? next : (next[0] || ''));
  };
  return <div className="flex flex-wrap gap-2" role={multiple ? 'group' : 'radiogroup'}>
    {options.map((option) => {
      const item = typeof option === 'object' ? option : { value: option, label: option };
      const active = selected.includes(item.value);
      return <button key={item.value} type="button" role={multiple ? 'checkbox' : 'radio'} aria-checked={active} onClick={() => toggle(item.value)} className={`border px-3 py-2 text-sm font-semibold transition ${active ? 'border-fm-ink bg-fm-ink text-white' : 'border-fm-graphite/20 bg-white text-fm-ink hover:bg-fm-mist/60'}`}>{item.label}</button>;
    })}
  </div>;
}
