import Icon from '../ui/Icon.jsx';
import { useSession } from '../../lib/session.jsx';
import { useToast } from '../feedback/Toast.jsx';

const modes = [{ key: 'CLIENT', label: 'Client', icon: 'briefcase', hint: 'Postezi proiecte și primești freelanceri potriviți' }, { key: 'FREELANCER', label: 'Freelancer', icon: 'user', hint: 'Primești proiecte potrivite pentru tine' }];

// Același cont, două moduri: schimbi ce vezi, nu cine ești
export default function ModeSwitch({ collapsed }) {
  const { mode, setMode } = useSession();
  const { error } = useToast();
  const switchMode = async (value) => { try { await setMode(value); } catch (e) { error(e); } };
  if (collapsed) {
    const next = modes.find((m) => m.key !== mode);
    const cur = modes.find((m) => m.key === mode);
    return (
      <button onClick={() => switchMode(next.key)} title={`Mod: ${cur.label}. Comută pe ${next.label}`} aria-label={`Mod ${cur.label}. Comută pe ${next.label}`}
        className="grid h-11 w-11 place-items-center rounded-md border border-white/15 bg-white/[0.04] text-white/80 transition hover:bg-white/10 hover:text-white">
        <Icon name={cur.icon} className="h-[18px] w-[18px]" />
      </button>
    );
  }
  return (
    <div className="w-full">
      <div className="px-1 pb-1.5"><p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/45">Spațiul de lucru</p><p className="mt-0.5 text-[10px] text-white/40">Același cont, comuți oricând</p></div>
      <div role="radiogroup" aria-label="Mod cont" className="grid grid-cols-2 gap-1 rounded-md border border-white/15 bg-white/[0.04] p-1">
        {modes.map((m) => (
          <button key={m.key} role="radio" aria-checked={mode === m.key} onClick={() => switchMode(m.key)} title={m.hint}
            className={`flex min-h-9 items-center justify-center gap-2 rounded-md px-2 text-sm font-semibold transition ${mode === m.key ? 'bg-white text-fm-ink' : 'text-white/65 hover:text-white'}`}>
            <Icon name={m.icon} className="h-4 w-4" />{m.label}
          </button>
        ))}
      </div>
    </div>
  );
}
