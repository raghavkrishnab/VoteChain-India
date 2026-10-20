import { useEffect, useState } from 'react';
import api from '../services/api';
import {
  registerOnChain,
  addCandidateOnChain,
  startElectionOnChain,
  endElectionOnChain,
} from '../services/blockchain';

export default function Admin() {
  // Store registered voters.
  const [voters, setVoters] = useState([]);

  // Store election information.
  const [title, setTitle] = useState('Demo Election');
  const [eid, setEid] = useState('');

  // Store party/candidate information.
  const [partyName, setPartyName] = useState('');
  const [partySymbol, setPartySymbol] = useState('');
  const [candidateName, setCandidateName] = useState('');
  const [candidateDescription, setCandidateDescription] = useState('');
  const [candidateIdentifier, setCandidateIdentifier] = useState(1);

  // Store status messages.
  const [msg, setMsg] = useState('');

  // Load voters from the backend.
  const load = async () => {
    try {
      const r = await api.get('/voters');

      setVoters(r.data.voters || []);
    } catch (e) {
      setMsg(
        `Unable to load voters: ${
          e.response?.data?.message || e.message
        }`
      );
    }
  };

  // Load voters when the admin page opens.
  useEffect(() => {
    load();
  }, []);

  // Create a new election.
  const create = async () => {
    if (!title.trim()) {
      setMsg('Enter an election title.');
      return;
    }

    setMsg('Creating election...');

    try {
      const r = await api.post('/elections', {
        title,
        description: 'Educational Sepolia election',
      });

      setEid(r.data.election._id);

      setMsg(
        'Election created in MongoDB. You can now add parties and candidates.'
      );
    } catch (e) {
      setMsg(
        `Election creation failed: ${
          e.response?.data?.message || e.message
        }`
      );
    }
  };

  // Add a party/candidate.
  const add = async () => {
    // Make sure an election exists.
    if (!eid) {
      setMsg('Create an election first.');
      return;
    }

    // Validate required fields.
    if (!partyName.trim()) {
      setMsg('Enter the party name.');
      return;
    }

    if (!candidateName.trim()) {
      setMsg('Enter the candidate name.');
      return;
    }

    if (!candidateIdentifier) {
      setMsg('Enter a candidate identifier.');
      return;
    }

    setMsg('Adding party and candidate...');

    try {
      // Convert identifier to a number.
      const identifier = Number(candidateIdentifier);

      // Add candidate to MongoDB.
      await api.post(`/elections/${eid}/candidates`, {
        partyName,
        partySymbol,
        name: candidateName,
        description: candidateDescription,
        candidateIdentifier: identifier,
      });

      // Add candidate to the blockchain.
      await addCandidateOnChain(identifier, candidateName);

      // Clear candidate form.
      setPartyName('');
      setPartySymbol('');
      setCandidateName('');
      setCandidateDescription('');
      setCandidateIdentifier(identifier + 1);

      setMsg(
        `${partyName} and ${candidateName} added successfully.`
      );
    } catch (e) {
      setMsg(
        `Candidate addition failed: ${
          e.response?.data?.message || e.message
        }`
      );
    }
  };

  // Start the election.
  const start = async () => {
    if (!eid) {
      setMsg('Create an election first.');
      return;
    }

    setMsg('Starting election...');

    try {
      await startElectionOnChain();

      await api.patch(`/elections/${eid}/start`);

      setMsg('Election started successfully.');
    } catch (e) {
      setMsg(
        `Election start failed: ${
          e.response?.data?.message || e.message
        }`
      );
    }
  };

  // End the election.
  const end = async () => {
    if (!eid) {
      setMsg('Create an election first.');
      return;
    }

    setMsg('Ending election...');

    try {
      await endElectionOnChain();

      await api.patch(`/elections/${eid}/end`);

      setMsg('Election ended successfully.');
    } catch (e) {
      setMsg(
        `Election end failed: ${
          e.response?.data?.message || e.message
        }`
      );
    }
  };

  return (
    <div className="space-y-6">

      {/* Page heading */}
      <h1 className="text-3xl font-bold">
        Admin Dashboard
      </h1>

      {/* Voter management */}
      <section className="bg-white border p-5 rounded-xl">
        <h2 className="font-bold mb-3">
          Voters
        </h2>

        {voters.length === 0 ? (
          <p className="text-slate-500">
            No voters available.
          </p>
        ) : (
          voters.map((voter) => (
            <div
              key={voter._id}
              className="border-b py-3 flex justify-between items-center"
            >
              <div>
                <p className="font-medium">
                  {voter.name}
                </p>

                <p className="text-sm text-slate-500">
                  {voter.walletAddress || 'No wallet'}
                </p>
              </div>

              <button
                className="text-indigo-600"
                onClick={async () => {
                  try {
                    if (!voter.walletAddress) {
                      setMsg(
                        'This voter does not have a wallet address.'
                      );
                      return;
                    }

                    await registerOnChain(
                      voter.walletAddress
                    );

                    await api.patch(
                      `/voters/${voter._id}/status`,
                      {
                        eligibilityStatus: 'eligible',
                      }
                    );

                    setMsg(
                      'Voter registered on-chain and approved.'
                    );

                    load();
                  } catch (e) {
                    setMsg(
                      `Voter approval failed: ${
                        e.response?.data?.message ||
                        e.message
                      }`
                    );
                  }
                }}
              >
                Approve + Register
              </button>
            </div>
          ))
        )}
      </section>

      {/* Election management */}
      <section className="bg-white border p-5 rounded-xl space-y-5">

        <h2 className="font-bold text-xl">
          Election Management
        </h2>

        {/* Election creation */}
        <div className="border rounded-xl p-4">

          <h3 className="font-semibold mb-3">
            1. Create Election
          </h3>

          <div className="flex gap-2">

            <input
              className="border p-2 rounded flex-1"
              value={title}
              onChange={(e) =>
                setTitle(e.target.value)
              }
              placeholder="Election title"
            />

            <button
              className="bg-indigo-600 text-white px-4 py-2 rounded"
              onClick={create}
            >
              Create Election
            </button>

          </div>

          {eid && (
            <p className="text-sm text-slate-600 mt-3">
              Election ID: {eid}
            </p>
          )}

        </div>

        {/* Party/candidate creation */}
        {eid && (
          <div className="border rounded-xl p-4">

            <h3 className="font-semibold mb-3">
              2. Add Party / Candidate
            </h3>

            <div className="grid md:grid-cols-2 gap-3">

              {/* Party name */}
              <input
                className="border p-2 rounded"
                value={partyName}
                onChange={(e) =>
                  setPartyName(e.target.value)
                }
                placeholder="Party name"
              />

              {/* Party symbol */}
              <input
                className="border p-2 rounded"
                value={partySymbol}
                onChange={(e) =>
                  setPartySymbol(e.target.value)
                }
                placeholder="Party symbol e.g. ⭐"
              />

              {/* Candidate name */}
              <input
                className="border p-2 rounded"
                value={candidateName}
                onChange={(e) =>
                  setCandidateName(e.target.value)
                }
                placeholder="Candidate name"
              />

              {/* Candidate identifier */}
              <input
                className="border p-2 rounded"
                type="number"
                value={candidateIdentifier}
                onChange={(e) =>
                  setCandidateIdentifier(e.target.value)
                }
                placeholder="Candidate identifier"
              />

            </div>

            {/* Candidate description */}
            <textarea
              className="border p-2 rounded w-full mt-3"
              rows="3"
              value={candidateDescription}
              onChange={(e) =>
                setCandidateDescription(e.target.value)
              }
              placeholder="Candidate / party details"
            />

            {/* Add candidate button */}
            <button
              className="mt-3 bg-green-600 text-white px-4 py-2 rounded"
              onClick={add}
            >
              Add Party / Candidate
            </button>

          </div>
        )}

        {/* Election controls */}
        {eid && (
          <div className="border rounded-xl p-4">

            <h3 className="font-semibold mb-3">
              3. Election Controls
            </h3>

            <button
              className="border px-4 py-2 rounded mr-2"
              onClick={start}
            >
              Start Election
            </button>

            <button
              className="border px-4 py-2 rounded"
              onClick={end}
            >
              End Election
            </button>

          </div>
        )}

        {/* Status message */}
        {msg && (
          <p className="text-sm bg-slate-100 p-3 rounded">
            {msg}
          </p>
        )}

      </section>
    </div>
  );
}