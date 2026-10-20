import { Link } from 'react-router-dom';
import Logo from './Logo';
import { NETWORK_NAME } from '../config/config';

const POINTS = [
  ['AI-verified identity', 'Your live photo is matched to your registered face, and your age is read from your ID.'],
  ['One wallet, one vote', 'The smart contract itself refuses a second vote, and nobody can change a vote afterwards.'],
  ['Publicly auditable', 'Every vote is a blockchain transaction that anyone can check.'],
];

// Two-column layout shared by the sign-in and registration pages.
export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-[1fr_minmax(0,560px)]">
      <aside className="hidden lg:flex flex-col justify-between bg-brand-950 text-white p-12 relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 tricolor" />
        <Link to="/"><Logo light size={40} /></Link>
        <div className="max-w-md">
          <h1 className="text-4xl font-bold leading-tight">
            Your vote. <span className="text-saffron-400">Your voice.</span>
            <br />
            Verified and <span className="text-india-100">tamper-proof.</span>
          </h1>
          <ul className="mt-10 space-y-6">
            {POINTS.map(([head, body]) => (
              <li key={head} className="flex gap-3">
                <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-saffron-400" />
                <div>
                  <p className="font-semibold">{head}</p>
                  <p className="text-brand-200 text-sm mt-0.5">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-brand-300">Educational prototype on {NETWORK_NAME}. Not for real elections.</p>
      </aside>

      <main className="flex flex-col justify-center px-5 py-10 sm:px-12">
        <div className="w-full max-w-md mx-auto">
          <Link to="/" className="lg:hidden inline-block mb-8"><Logo /></Link>
          <h2 className="text-3xl font-bold text-brand-950">{title}</h2>
          {subtitle && <p className="text-slate-600 mt-2">{subtitle}</p>}
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-8 text-center text-sm text-slate-500">{footer}</div>}
        </div>
      </main>
    </div>
  );
}
