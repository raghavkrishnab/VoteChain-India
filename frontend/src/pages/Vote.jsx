import { useCallback, useEffect, useState } from 'react';

import api, { errorMessage } from '../services/api';
import { castVoteOnChain } from '../services/blockchain';
import { useAuth } from '../context/AuthContext';
import { EXPLORER_URL } from '../config/config';
import { Alert, Button, Card } from '../components/ui';

export default function Vote() {
  const { user } = useAuth();
  const [elections, setElections] = useState([]);
  const [electionId, setElectionId] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [selected, setSelected] = useState(null);
  const [recorded, setRecorded] = useState(null);
  // A vote that is on-chain but not yet indexed by the backend, kept so recording can be retried.
  const [pendingTx, setPendingTx] = useState(null);
  const [msg, setMsg] = useState({ kind: 'info', text: '' });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .get('/elections')
      .then(({ data }) => {
        const active = data.elections.filter((e) => e.status === 'active');
        setElections(active);
        setElectionId(active[0]?._id || '');
      })
      .catch((e) => setMsg({ kind: 'error', text: errorMessage(e, 'Unable to load elections.') }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!electionId) return;
    setSelected(null);
    setPendingTx(null);
    setMsg({ kind: 'info', text: '' });
    Promise.all([api.get(`/elections/${electionId}/candidates`), api.get(`/voting/status/${electionId}`)])
      .then(([c, s]) => {
        setCandidates(c.data.candidates);
        setRecorded(s.data.transaction);
      })
      .catch((e) => setMsg({ kind: 'error', text: errorMessage(e) }));
  }, [electionId]);

  const election = elections.find((e) => e._id === electionId);

  const recordVote = useCallback(
    async (hash) => {
      const { data } = await api.post('/voting/transaction', { electionId, transactionHash: hash });
      setRecorded(data.transaction);
      setPendingTx(null);
      setMsg({ kind: 'success', text: 'Vote confirmed on-chain and recorded.' });
    },
    [electionId]
  );

  const vote = async () => {
    setBusy(true);
    setMsg({ kind: 'info', text: 'Confirm the transaction in MetaMask and wait for it to be mined…' });
    let hash;
    try {
      ({ hash } = await castVoteOnChain(election.chainElectionId, selected.candidateIdentifier, user.walletAddress));
      setPendingTx(hash);
      await recordVote(hash);
    } catch (e) {
      const text = hash
        ? `Your vote is on-chain (${hash}) but recording it failed: ${errorMessage(e)}`
        : errorMessage(e, 'Vote failed.');
      setMsg({ kind: 'error', text });
    } finally {
      setBusy(false);
    }
  };

  const retryRecord = async () => {
    setBusy(true);
    try {
      await recordVote(pendingTx);
    } catch (e) {
      setMsg({ kind: 'error', text: errorMessage(e) });
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <p className="text-slate-500">Loading elections…</p>;
  if (!elections.length) return <Card title="Cast your vote"><p className="text-slate-500">There is no active election right now.</p></Card>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Cast your vote</h1>
          {election?.description && <p className="text-slate-600 mt-1">{election.description}</p>}
        </div>
        {elections.length > 1 && (
          <select className="border rounded-lg px-3 py-2" value={electionId} onChange={(e) => setElectionId(e.target.value)}>
            {elections.map((e) => <option key={e._id} value={e._id}>{e.title}</option>)}
          </select>
        )}
      </div>

      {recorded ? (
        <Alert kind="success">
          You have voted in <b>{election.title}</b>. Transaction{' '}
          <a className="underline break-all" href={`${EXPLORER_URL}/tx/${recorded.transactionHash}`} target="_blank" rel="noreferrer">
            {recorded.transactionHash}
          </a>{' '}
          (block {recorded.blockNumber}).
        </Alert>
      ) : (
        <>
          <div className="grid md:grid-cols-2 gap-4">
            {candidates.map((c) => {
              const isSelected = selected?._id === c._id;
              return (
                <button
                  key={c._id}
                  type="button"
                  disabled={busy || !!pendingTx}
                  onClick={() => setSelected(c)}
                  className={`text-left bg-white border-2 p-5 rounded-2xl transition ${isSelected ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 hover:border-indigo-400'}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-bold">{c.partySymbol} {c.partyName}</h3>
                      <p className="font-medium text-slate-700 mt-1">Candidate: {c.name}</p>
                    </div>
                    <span className="text-2xl">{isSelected ? '✓' : '○'}</span>
                  </div>
                  {c.description && <p className="text-sm text-slate-600 mt-3">{c.description}</p>}
                </button>
              );
            })}
          </div>

          {pendingTx ? (
            <Button onClick={retryRecord} disabled={busy}>Retry recording vote</Button>
          ) : (
            selected && (
              <Card title="Confirm your vote">
                <p>You selected <b>{selected.partyName}</b> — {selected.name}.</p>
                <p className="text-sm text-red-600 mt-3">⚠️ Once submitted to the blockchain, this vote cannot be changed.</p>
                <Button className="mt-4" onClick={vote} disabled={busy}>{busy ? 'Submitting…' : 'Confirm vote'}</Button>
              </Card>
            )
          )}
        </>
      )}

      <Alert kind={msg.kind}>{msg.text}</Alert>
    </div>
  );
}
