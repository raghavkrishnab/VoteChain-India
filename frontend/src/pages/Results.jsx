import { useEffect, useState } from 'react';

import api, { errorMessage } from '../services/api';
import { Alert, Card, StatusBadge } from '../components/ui';

export default function Results() {
  const [elections, setElections] = useState([]);
  const [electionId, setElectionId] = useState('');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/elections')
      .then(({ data: d }) => {
        // Drafts have no votes yet.
        const started = d.elections.filter((e) => e.status !== 'draft');
        setElections(started);
        setElectionId(started[0]?._id || '');
      })
      .catch((e) => setError(errorMessage(e)));
  }, []);

  useEffect(() => {
    if (!electionId) return;
    setData(null);
    setError('');
    const load = () =>
      api
        .get(`/elections/${electionId}/results`)
        .then((r) => {
          setData(r.data);
          setError('');
        })
        .catch((e) => setError(errorMessage(e, 'Could not read results from the blockchain.')));
    load();
    // Live tally while voting is open.
    const timer = setInterval(load, 10000);
    return () => clearInterval(timer);
  }, [electionId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-brand-950">Public results</h1>
          <p className="text-sm text-slate-600 mt-1">Vote counts are read live from the smart contract and refresh every 10 seconds.</p>
        </div>
        {elections.length > 1 && (
          <select className="bg-white border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-brand-500" value={electionId} onChange={(e) => setElectionId(e.target.value)}>
            {elections.map((e) => <option key={e._id} value={e._id}>{e.title}</option>)}
          </select>
        )}
      </div>

      <Alert kind="error">{error}</Alert>
      {!elections.length && !error && <p className="text-slate-500">No election has started yet.</p>}

      {data && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">{data.election.title}</h2>
            <div className="text-sm text-slate-600 flex items-center gap-2">
              <StatusBadge status={data.election.status} /> {data.totalVotes} vote{data.totalVotes === 1 ? '' : 's'}
            </div>
          </div>
          <ul className="space-y-4">
            {[...data.results].sort((a, b) => b.votes - a.votes).map((r) => {
              const pct = data.totalVotes ? Math.round((r.votes / data.totalVotes) * 100) : 0;
              return (
                <li key={r.candidateIdentifier}>
                  <div className="flex justify-between text-sm mb-1">
                    <span><b>{r.partySymbol} {r.partyName || 'Candidate'}</b> — {r.name}</span>
                    <span>{r.votes} ({pct}%)</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-600" style={{ width: `${pct}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}
