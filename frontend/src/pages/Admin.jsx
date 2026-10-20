import { useCallback, useEffect, useState } from 'react';

import api, { errorMessage } from '../services/api';
import {
  addCandidateOnChain,
  createElectionOnChain,
  endElectionOnChain,
  registerVoterOnChain,
  startElectionOnChain,
} from '../services/blockchain';
import { Alert, Button, Card, StatusBadge, inputClass, shortAddress } from '../components/ui';

const EMPTY_CANDIDATE = { partyName: '', partySymbol: '', name: '', description: '' };

// Sends the on-chain transaction, then asks the backend to sync from the chain.
// If the transaction fails because it already happened (e.g. a previous attempt
// succeeded on-chain but the sync failed), the sync alone still succeeds.
async function chainThenSync(chainStep, syncStep) {
  try {
    await chainStep();
  } catch (chainError) {
    try {
      return await syncStep();
    } catch {
      throw chainError;
    }
  }
  return syncStep();
}

function Voters({ setMsg }) {
  const [voters, setVoters] = useState([]);
  const [busyId, setBusyId] = useState('');

  const load = useCallback(() => {
    api.get('/voters').then((r) => setVoters(r.data.voters)).catch((e) => setMsg({ kind: 'error', text: errorMessage(e) }));
  }, [setMsg]);

  useEffect(load, [load]);

  const decide = async (voter, decision) => {
    setBusyId(voter.id);
    setMsg({ kind: 'info', text: decision === 'approved' ? 'Registering wallet on-chain — confirm in MetaMask…' : 'Rejecting…' });
    try {
      if (decision === 'approved') await registerVoterOnChain(voter.walletAddress);
      await api.patch(`/voters/${voter.id}/approval`, { decision });
      setMsg({ kind: 'success', text: `${voter.name} ${decision}.` });
      load();
    } catch (e) {
      setMsg({ kind: 'error', text: errorMessage(e) });
    } finally {
      setBusyId('');
    }
  };

  return (
    <Card title={`Voters (${voters.length})`}>
      {voters.length === 0 ? (
        <p className="text-slate-500">No voters registered yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500">
              <tr>
                <th className="py-2">Voter</th>
                <th>Wallet</th>
                <th>Face</th>
                <th>Age</th>
                <th>Approval</th>
                <th />
              </tr>
            </thead>
            <tbody className="divide-y">
              {voters.map((v) => {
                const aiPassed = v.verificationStatus === 'verified' && v.eligibilityStatus === 'eligible';
                return (
                  <tr key={v.id}>
                    <td className="py-3">
                      <div className="font-medium">{v.name}</div>
                      <div className="text-slate-500">{v.email} · {v.demoVoterId}</div>
                    </td>
                    <td className="font-mono" title={v.walletAddress}>{shortAddress(v.walletAddress)}</td>
                    <td><StatusBadge status={v.verificationStatus} /></td>
                    <td><StatusBadge status={v.eligibilityStatus} /></td>
                    <td><StatusBadge status={v.documentStatus} /></td>
                    <td className="text-right whitespace-nowrap space-x-2">
                      {v.documentStatus !== 'approved' && (
                        <Button
                          variant="success"
                          className="text-xs px-3 py-1"
                          disabled={!aiPassed || !v.walletAddress || busyId === v.id}
                          title={aiPassed ? '' : 'Voter must pass AI verification first'}
                          onClick={() => decide(v, 'approved')}
                        >
                          Register & approve
                        </Button>
                      )}
                      {v.documentStatus === 'pending' && (
                        <Button variant="danger" className="text-xs px-3 py-1" disabled={busyId === v.id} onClick={() => decide(v, 'rejected')}>
                          Reject
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function ElectionManager({ election, onChange, setMsg }) {
  const [candidates, setCandidates] = useState([]);
  const [form, setForm] = useState(EMPTY_CANDIDATE);
  const [busy, setBusy] = useState(false);

  const loadCandidates = useCallback(() => {
    api.get(`/elections/${election._id}/candidates`).then((r) => setCandidates(r.data.candidates)).catch((e) => setMsg({ kind: 'error', text: errorMessage(e) }));
  }, [election._id, setMsg]);

  useEffect(loadCandidates, [loadCandidates]);

  const nextIdentifier = Math.max(0, ...candidates.map((c) => c.candidateIdentifier)) + 1;

  const run = async (label, action) => {
    setBusy(true);
    setMsg({ kind: 'info', text: `${label} — confirm in MetaMask and wait for the transaction…` });
    try {
      await action();
      setMsg({ kind: 'success', text: `${label}: done.` });
    } catch (e) {
      setMsg({ kind: 'error', text: `${label} failed: ${errorMessage(e)}` });
    } finally {
      setBusy(false);
    }
  };

  const addCandidate = (e) => {
    e.preventDefault();
    const candidateIdentifier = nextIdentifier;
    run(`Adding ${form.name}`, async () => {
      await chainThenSync(
        () => addCandidateOnChain(election.chainElectionId, candidateIdentifier, form.name.trim()),
        () => api.post(`/elections/${election._id}/candidates`, { ...form, candidateIdentifier })
      );
      setForm(EMPTY_CANDIDATE);
      loadCandidates();
    });
  };

  const setStatus = (label, chainStep, endpoint) =>
    run(label, async () => {
      await chainThenSync(() => chainStep(election.chainElectionId), () => api.patch(`/elections/${election._id}/${endpoint}`));
      onChange();
    });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="text-lg font-semibold">{election.title}</h3>
        <StatusBadge status={election.status} />
        <span className="text-xs text-slate-500">on-chain id #{election.chainElectionId}</span>
        <div className="ml-auto space-x-2">
          {election.status === 'draft' && (
            <Button disabled={busy || candidates.length === 0} onClick={() => setStatus('Starting election', startElectionOnChain, 'start')}>
              Start election
            </Button>
          )}
          {election.status === 'active' && (
            <Button variant="danger" disabled={busy} onClick={() => setStatus('Ending election', endElectionOnChain, 'end')}>
              End election
            </Button>
          )}
        </div>
      </div>

      <ul className="divide-y border rounded-xl">
        {candidates.length === 0 && <li className="p-3 text-slate-500">No candidates yet.</li>}
        {candidates.map((c) => (
          <li key={c._id} className="p-3 flex justify-between">
            <span><b>{c.partySymbol} {c.partyName}</b> — {c.name}</span>
            <span className="text-xs text-slate-500">#{c.candidateIdentifier}</span>
          </li>
        ))}
      </ul>

      {election.status === 'draft' && (
        <form onSubmit={addCandidate} className="border rounded-xl p-4 space-y-3">
          <h4 className="font-semibold">Add party / candidate (#{nextIdentifier})</h4>
          <div className="grid md:grid-cols-3 gap-3">
            <input className={inputClass} placeholder="Party name" value={form.partyName} onChange={(e) => setForm({ ...form, partyName: e.target.value })} required />
            <input className={inputClass} placeholder="Symbol, e.g. ⭐" value={form.partySymbol} onChange={(e) => setForm({ ...form, partySymbol: e.target.value })} />
            <input className={inputClass} placeholder="Candidate name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <textarea className={inputClass} rows="2" placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Button type="submit" variant="success" disabled={busy}>Add candidate</Button>
        </form>
      )}
    </div>
  );
}

export default function Admin() {
  const [elections, setElections] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [msg, setMsg] = useState({ kind: 'info', text: '' });

  const loadElections = useCallback(async () => {
    const { data } = await api.get('/elections');
    setElections(data.elections);
    return data.elections;
  }, []);

  useEffect(() => {
    loadElections()
      .then((list) => setSelectedId((id) => id || list[0]?._id || ''))
      .catch((e) => setMsg({ kind: 'error', text: errorMessage(e) }));
  }, [loadElections]);

  const create = async (e) => {
    e.preventDefault();
    setCreating(true);
    setMsg({ kind: 'info', text: 'Creating election on-chain — confirm in MetaMask…' });
    try {
      const chainElectionId = await createElectionOnChain();
      const { data } = await api.post('/elections', { title, description, chainElectionId });
      await loadElections();
      setSelectedId(data.election._id);
      setTitle('');
      setDescription('');
      setMsg({ kind: 'success', text: `Election created (on-chain id #${chainElectionId}). Add candidates, then start it.` });
    } catch (x) {
      setMsg({ kind: 'error', text: `Election creation failed: ${errorMessage(x)}` });
    } finally {
      setCreating(false);
    }
  };

  const selected = elections.find((e) => e._id === selectedId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin</h1>
        <p className="text-sm text-slate-600 mt-1">Transactions must be sent from the wallet that deployed the contract.</p>
      </div>

      <Alert kind={msg.kind}>{msg.text}</Alert>

      <Card title="Elections">
        <div className="grid md:grid-cols-[16rem_1fr] gap-6">
          <div className="space-y-4">
            <ul className="space-y-1">
              {elections.map((e) => (
                <li key={e._id}>
                  <button
                    onClick={() => setSelectedId(e._id)}
                    className={`w-full text-left px-3 py-2 rounded-lg flex justify-between items-center ${e._id === selectedId ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50'}`}
                  >
                    <span className="truncate">{e.title}</span>
                    <StatusBadge status={e.status} />
                  </button>
                </li>
              ))}
            </ul>
            <form onSubmit={create} className="border-t pt-4 space-y-2">
              <h4 className="font-semibold text-sm">New election</h4>
              <input className={inputClass} placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
              <input className={inputClass} placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
              <Button type="submit" className="w-full" disabled={creating}>{creating ? 'Creating…' : 'Create election'}</Button>
            </form>
          </div>
          <div>
            {selected ? (
              <ElectionManager key={selected._id} election={selected} onChange={loadElections} setMsg={setMsg} />
            ) : (
              <p className="text-slate-500">Create an election to get started.</p>
            )}
          </div>
        </div>
      </Card>

      <Voters setMsg={setMsg} />
    </div>
  );
}
