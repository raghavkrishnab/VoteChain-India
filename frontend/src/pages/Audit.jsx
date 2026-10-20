import { useEffect, useState } from 'react';

import api, { errorMessage } from '../services/api';
import { EXPLORER_URL } from '../config/config';
import { Alert, shortAddress } from '../components/ui';

export default function Audit() {
  const [entries, setEntries] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/audit').then((r) => setEntries(r.data.audit)).catch((e) => setError(errorMessage(e)));
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold">Audit trail</h1>
        <p className="text-sm text-slate-600 mt-1">
          Every vote below was verified against its on-chain transaction receipt before being recorded. Follow a link to check it independently.
        </p>
      </div>
      <Alert kind="error">{error}</Alert>
      {!entries.length && !error && <p className="text-slate-500">No votes recorded yet.</p>}
      {entries.length > 0 && (
        <div className="overflow-x-auto bg-white border rounded-xl">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="p-3">Election</th>
                <th className="p-3">Voter wallet</th>
                <th className="p-3">Block</th>
                <th className="p-3">Transaction</th>
                <th className="p-3">Recorded</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {entries.map((x) => (
                <tr key={x._id}>
                  <td className="p-3">{x.electionId?.title || '—'}</td>
                  <td className="p-3 font-mono" title={x.walletAddress}>{shortAddress(x.walletAddress)}</td>
                  <td className="p-3">{x.blockNumber}</td>
                  <td className="p-3 font-mono">
                    <a className="text-indigo-600 underline" href={`${EXPLORER_URL}/tx/${x.transactionHash}`} target="_blank" rel="noreferrer">
                      {shortAddress(x.transactionHash)}
                    </a>
                  </td>
                  <td className="p-3">{new Date(x.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
