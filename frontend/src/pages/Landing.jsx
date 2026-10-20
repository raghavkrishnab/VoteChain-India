import { Link } from 'react-router-dom';

import Logo from '../components/Logo';
import { APP_NAME, NETWORK_NAME } from '../config/config';

const STEPS = [
  ['Register', 'Create an account with your MetaMask wallet, a demo ID document and a face photo.'],
  ['Verify', 'Take a live photo. AI matches it to your registered face and checks you are 18+.'],
  ['Get approved', 'The election admin registers your wallet on the blockchain voter list.'],
  ['Vote', 'Cast one vote from your wallet. The smart contract records it permanently.'],
];

const FEATURES = [
  ['Tamper-proof', 'Votes live in a smart contract. Duplicate votes are rejected by the blockchain itself.', 'border-l-saffron-400'],
  ['AI-verified', 'Face matching and age checks happen before anyone is allowed to vote.', 'border-l-brand-300'],
  ['Transparent', 'Results are read live from the chain, and every vote has a public transaction.', 'border-l-india-500'],
];

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="bg-brand-950">
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
          <Logo light />
          <div className="flex gap-2">
            <Link to="/login" className="px-4 py-2 text-sm text-white hover:bg-white/10 rounded-lg">Sign in</Link>
            <Link to="/register" className="px-4 py-2 text-sm font-semibold bg-saffron-400 hover:bg-saffron-500 text-brand-950 rounded-lg">Register</Link>
          </div>
        </div>
        <div className="tricolor" />
      </header>

      <section className="bg-brand-950 text-white">
        <div className="max-w-6xl mx-auto px-5 py-16 sm:py-24 grid lg:grid-cols-[1.2fr_1fr] gap-12 items-center">
          <div>
            <p className="text-saffron-400 font-semibold text-sm uppercase tracking-wider">Secure remote voting prototype</p>
            <h1 className="text-4xl sm:text-5xl font-bold leading-tight mt-3">
              Every eligible voice, <span className="text-saffron-400">counted once</span> and <span className="text-india-100">verifiably</span>.
            </h1>
            <p className="text-brand-200 mt-5 text-lg max-w-xl">
              {APP_NAME} combines AI identity checks with a blockchain ballot box on {NETWORK_NAME}, built for overseas Indian electors.
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              <Link to="/register" className="px-6 py-3 font-semibold bg-saffron-400 hover:bg-saffron-500 text-brand-950 rounded-xl">Register to vote</Link>
              <Link to="/login" className="px-6 py-3 font-semibold border border-white/30 hover:bg-white/10 rounded-xl">Sign in</Link>
            </div>
          </div>
          <div className="grid gap-3">
            {FEATURES.map(([title, body, accent]) => (
              <div key={title} className={`bg-white/5 border border-white/10 border-l-4 ${accent} rounded-r-xl p-5`}>
                <p className="font-semibold">{title}</p>
                <p className="text-sm text-brand-200 mt-1">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-6xl w-full mx-auto px-5 py-16">
        <p className="text-saffron-500 font-semibold text-sm uppercase tracking-wider">How it works</p>
        <h2 className="text-3xl font-bold text-brand-950 mt-2">Four steps from sign-up to a counted vote</h2>
        <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          {STEPS.map(([title, body], i) => (
            <li key={title} className="border border-slate-200 rounded-2xl p-5 bg-slate-50">
              <span className="inline-grid place-items-center h-9 w-9 rounded-full bg-brand-800 text-white font-bold">{i + 1}</span>
              <p className="font-semibold text-brand-950 mt-4">{title}</p>
              <p className="text-sm text-slate-600 mt-1">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      <footer className="mt-auto border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-5 py-6 text-xs text-slate-500">
          Educational prototype using synthetic demo data. It is not connected to any government system and must not be used for real elections.
        </div>
      </footer>
    </div>
  );
}
