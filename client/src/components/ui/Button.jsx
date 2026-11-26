const variants = {
  primary: 'bg-fm-ink text-white hover:bg-fm-graphite',
  light: 'bg-fm-mist text-fm-ink hover:bg-white',
  outline: 'border border-fm-graphite/25 text-fm-ink hover:bg-fm-mist/50',
  ghost: 'text-fm-ink hover:bg-fm-mist/50',
};

export default function Button({ variant = 'primary', className = '', loading, children, ...props }) {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-md px-6 py-3 text-sm font-semibold transition
        disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-fm-graphite/40
        ${variants[variant]} ${className}`}
    >
      {loading ? 'Se încarcă…' : children}
    </button>
  );
}
