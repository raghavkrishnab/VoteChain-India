export function Card({ title, children, className = '' }) {
  return (
    <section className={`bg-white border border-slate-200 rounded-2xl p-5 shadow-sm ${className}`}>
      {title && <h2 className="font-semibold text-lg mb-4">{title}</h2>}
      {children}
    </section>
  );
}

const BUTTON_STYLES = {
  primary: 'bg-indigo-600 hover:bg-indigo-500 text-white',
  success: 'bg-emerald-600 hover:bg-emerald-500 text-white',
  danger: 'bg-white border border-red-300 text-red-700 hover:bg-red-50',
  secondary: 'bg-white border border-slate-300 hover:bg-slate-50',
};

export function Button({ variant = 'primary', className = '', ...props }) {
  return <button className={`px-4 py-2 rounded-lg font-medium transition ${BUTTON_STYLES[variant]} ${className}`} {...props} />;
}

const ALERT_STYLES = {
  info: 'bg-slate-100 border-slate-200 text-slate-700',
  success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  error: 'bg-red-50 border-red-200 text-red-700',
};

export function Alert({ kind = 'info', children }) {
  if (!children) return null;
  return <div className={`border rounded-lg p-3 text-sm break-words ${ALERT_STYLES[kind]}`}>{children}</div>;
}

const GOOD = new Set(['approved', 'verified', 'eligible', 'active']);
const BAD = new Set(['rejected', 'not_eligible']);

export function StatusBadge({ status }) {
  const value = status || 'pending';
  const tone = GOOD.has(value) ? 'bg-emerald-100 text-emerald-700' : BAD.has(value) ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700';
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${tone}`}>{value.replace('_', ' ')}</span>;
}

export const shortAddress = (address) => (address ? `${address.slice(0, 6)}…${address.slice(-4)}` : '—');

export const inputClass = 'w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500';
