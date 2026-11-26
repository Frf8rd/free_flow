export function LogoMark({ className = 'h-8 w-8' }) {
  return <img src="/logo.png" alt="" aria-hidden="true" className={`${className} object-contain`} draggable={false} />;
}

export default function Logo({ dark = false, className = '' }) {
  return (
    <div className={`flex items-center gap-2.5 ${dark ? 'text-white' : 'text-fm-ink'} ${className}`}>
      <LogoMark />
      <span className="text-lg font-semibold tracking-tight">FairMatch</span>
    </div>
  );
}
