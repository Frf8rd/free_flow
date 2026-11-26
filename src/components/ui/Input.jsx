import { useState } from 'react';

const svgProps = { viewBox: '0 0 24 24', className: 'h-5 w-5', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };

const Eye = ({ off }) => (
  <svg {...svgProps}>
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
    {off && <path d="M4 4l16 16" />}
  </svg>
);

export const MailIcon = (<svg {...svgProps}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg>);
export const LockIcon = (<svg {...svgProps}><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 018 0v3" /></svg>);
export const UserIcon = (<svg {...svgProps}><circle cx="12" cy="8" r="4" /><path d="M4 21c1-4 4-6 8-6s7 2 8 6" /></svg>);

export default function Input({ label, icon, type = 'text', error, className = '', ...props }) {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';

  return (
    <label className={`block ${className}`}>
      {label && <span className="mb-1.5 block text-sm font-medium text-fm-ink">{label}</span>}
      <span
        className={`flex items-center gap-3 rounded-md border bg-white px-4 transition focus-within:ring-2 focus-within:ring-fm-graphite/30
        ${error ? 'border-red-400' : 'border-fm-graphite/15 focus-within:border-fm-graphite'}`}
      >
        {icon && <span className="text-fm-slate/50">{icon}</span>}
        <input
          {...props}
          type={isPassword && show ? 'text' : type}
          className="w-full bg-transparent py-3 text-sm text-fm-ink placeholder:text-fm-slate/45 focus:outline-none"
        />
        {isPassword && (
          <button type="button" onClick={() => setShow((s) => !s)} className="text-fm-slate/50 hover:text-fm-ink" aria-label="Arată parola">
            <Eye off={show} />
          </button>
        )}
      </span>
      {error && <span className="mt-1 block text-xs text-red-500">{error}</span>}
    </label>
  );
}
