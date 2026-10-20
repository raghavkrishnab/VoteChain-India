import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { useAuth, isEligibleToVote } from '../context/AuthContext';
import api from '../services/api';
import { Card, StatusBadge } from '../components/ui';

function Step({ done, title, children }) {
  return (
    <li className="flex gap-3">
      <span className={`mt-0.5 w-6 h-6 shrink-0 rounded-full grid place-items-center text-xs font-bold ${done ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
        {done ? '✓' : '•'}
      </span>
      <div>
        <p className="font-medium">{title}</p>
        <div className="text-sm text-slate-500">{children}</div>
      </div>
    </li>
  );
}

export default function Dashboard() {
  const { user, refreshUser } = useAuth();
  const [elections, setElections] = useState([]);

  useEffect(() => {
    api.get('/elections').then((r) => setElections(r.data.elections)).catch(() => setElections([]));
    // Pick up admin approval that happened since login.
    refreshUser().catch(() => {});
  }, [refreshUser]);

  const active = elections.filter((e) => e.status === 'active');
  const isVoter = user.role === 'voter';
  const canVote = isEligibleToVote(user);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-saffron-500 text-xs font-semibold uppercase tracking-wider">{isVoter ? 'Voter dashboard' : 'Administrator'}</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-brand-950 mt-1">Welcome, {user.name}</h1>
      </div>

      <div className="relative overflow-hidden rounded-3xl bg-brand-900 p-7 pt-8 text-white shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="absolute inset-x-0 top-0 tricolor" />
        <div>
          <p className="text-saffron-400 text-xs font-semibold uppercase tracking-wider">Active elections</p>
          <h2 className="text-2xl font-bold mt-2">{active.length ? active.map((e) => e.title).join(' · ') : 'No active election'}</h2>
          <p className="text-brand-100 mt-2">
            {active.length ? 'Votes are cast directly to the smart contract from your wallet.' : 'Check back when an election has started.'}
          </p>
        </div>
        {isVoter && active.length > 0 && (
          <Link to={canVote ? '/vote' : '/verify'} className="bg-white text-brand-700 px-6 py-3 rounded-xl font-bold hover:bg-brand-50 text-center">
            {canVote ? 'Cast your vote →' : 'Complete verification →'}
          </Link>
        )}
        {!isVoter && (
          <Link to="/admin" className="bg-white text-brand-700 px-6 py-3 rounded-xl font-bold hover:bg-brand-50 text-center">Open admin panel →</Link>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {isVoter && (
          <Card title="Your path to voting">
            <ol className="space-y-4">
              <Step done title="Registered">Account and wallet {user.walletAddress} linked.</Step>
              <Step done={user.verificationStatus === 'verified' && user.eligibilityStatus === 'eligible'} title="AI verification">
                Face match <StatusBadge status={user.verificationStatus} /> · Age check <StatusBadge status={user.eligibilityStatus} />
                {user.verificationStatus !== 'verified' || user.eligibilityStatus !== 'eligible' ? (
                  <Link to="/verify" className="ml-2 text-brand-600">Verify now</Link>
                ) : null}
              </Step>
              <Step done={user.documentStatus === 'approved'} title="Admin approval">
                The admin registers your wallet on-chain and approves you. <StatusBadge status={user.documentStatus} />
              </Step>
              <Step done={false} title="Vote">One vote per election, enforced by the smart contract.</Step>
            </ol>
          </Card>
        )}

        <Card title={`Elections (${elections.length})`} className={isVoter ? '' : 'md:col-span-2'}>
          {elections.length === 0 ? (
            <p className="text-slate-500">No elections yet.</p>
          ) : (
            <ul className="divide-y">
              {elections.map((e) => (
                <li key={e._id} className="py-3 flex items-center justify-between">
                  <span className="font-medium">{e.title}</span>
                  <StatusBadge status={e.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
