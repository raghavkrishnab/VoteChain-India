import { EXPLORER_URL } from '../config/config';

export function Card({ title, subtitle, action, children, className = '' }) {
  return (
    <section className={`bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-sm ${className}`}>
      {(title || action) && (
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            {title && <h2 className="font-semibold text-lg text-brand-950">{title}</h2>}
            {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function PageHeader({ eyebrow, title, children, action }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div>
        {eyebrow && <p className="text-xs font-semibold uppercase tracking-wider text-saffron-500">{eyebrow}</p>}
        <h1 className="text-2xl sm:text-3xl font-bold text-brand-950 mt-1">{title}</h1>
        {children && <p className="text-slate-600 mt-1.5 max-w-2xl">{children}</p>}
      </div>
      {action}
    </div>
  );
}

const BUTTON_STYLES = {
  primary: 'bg-brand-800 hover:bg-brand-700 text-white shadow-sm',
  success: 'bg-india-500 hover:bg-india-600 text-white shadow-sm',
  saffron: 'bg-saffron-400 hover:bg-saffron-500 text-brand-950 shadow-sm',
  danger: 'bg-white border border-red-300 text-red-700 hover:bg-red-50',
  secondary: 'bg-white border border-slate-300 text-slate-800 hover:bg-slate-50',
};

export function Button({ variant = 'primary', className = '', ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${BUTTON_STYLES[variant]} ${className}`}
      {...props}
    />
  );
}

const ALERT_STYLES = {
  info: 'bg-brand-50 border-brand-100 text-brand-800',
  success: 'bg-india-50 border-india-100 text-india-700',
  error: 'bg-red-50 border-red-200 text-red-700',
  warning: 'bg-saffron-50 border-saffron-100 text-saffron-700',
};

export function Alert({ kind = 'info', children }) {
  if (!children) return null;
  return (
    <div role={kind === 'error' ? 'alert' : 'status'} className={`border rounded-xl p-3 text-sm break-words ${ALERT_STYLES[kind]}`}>
      {children}
    </div>
  );
}

const GOOD = new Set(['approved', 'verified', 'eligible', 'active']);
const BAD = new Set(['rejected', 'not_eligible']);

export function StatusBadge({ status }) {
  const value = status || 'pending';
  const tone = GOOD.has(value)
    ? 'bg-india-50 text-india-700 ring-india-100'
    : BAD.has(value)
      ? 'bg-red-50 text-red-700 ring-red-200'
      : 'bg-saffron-50 text-saffron-700 ring-saffron-100';
  return <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 capitalize ${tone}`}>{value.replace('_', ' ')}</span>;
}

export const shortAddress = (address) => (address ? `${address.slice(0, 6)}…${address.slice(-4)}` : '—');

export const inputClass =
  'w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100';

export function TxLink({ hash, short = false, className = '' }) {
  const text = short ? shortAddress(hash) : hash;
  if (!EXPLORER_URL) return <span className={`font-mono ${className}`} title={hash}>{text}</span>;
  return (
    <a className={`font-mono underline ${className}`} href={`${EXPLORER_URL}/tx/${hash}`} target="_blank" rel="noreferrer" title={hash}>
      {text}
    </a>
  );
}
