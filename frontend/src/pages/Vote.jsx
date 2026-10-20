import { useEffect, useState } from 'react';
import api from '../services/api';
import { castVote, hasVotedOnChain } from '../services/blockchain';
import { useAuth } from '../context/AuthContext';

export default function Vote() {
  // Get the currently logged-in voter.
  const { user } = useAuth();

  // Store the active election.
  const [election, setElection] = useState(null);

  // Store all candidates/parties.
  const [candidates, setCandidates] = useState([]);

  // Store the selected candidate.
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  // Store status messages.
  const [msg, setMsg] = useState('');

  // Store loading state.
  const [loading, setLoading] = useState(true);

  // Load the active election and its candidates.
  useEffect(() => {
    const loadElection = async () => {
      try {
        // Get all elections.
        const response = await api.get('/elections');

        // Find the currently active election.
        const activeElection = response.data.elections.find(
          (item) => item.status === 'active'
        );

        // Save the active election.
        setElection(activeElection);

        // Load candidates if an active election exists.
        if (activeElection) {
          const candidateResponse = await api.get(
            `/elections/${activeElection._id}/candidates`
          );

          // Save candidates.
          setCandidates(candidateResponse.data.candidates);
        }
      } catch (error) {
        setMsg(
          error.response?.data?.message ||
          'Unable to load election details.'
        );
      } finally {
        setLoading(false);
      }
    };

    loadElection();
  }, []);

  // Cast the selected vote.
  const vote = async () => {
    // Make sure a candidate has been selected.
    if (!selectedCandidate) {
      setMsg('Please select a party/candidate first.');
      return;
    }

    // Make sure an election exists.
    if (!election) {
      setMsg('No active election.');
      return;
    }

    try {
      // Check whether this wallet has already voted.
      if (
        user?.walletAddress &&
        await hasVotedOnChain(user.walletAddress)
      ) {
        throw new Error('Vote rejected: voter has already voted.');
      }

      // Send the vote to the blockchain.
      const result = await castVote(
        selectedCandidate.candidateIdentifier
      );

      // Store the blockchain transaction in the backend.
      await api.post('/voting/transaction', {
        electionId: election._id,
        candidateId: selectedCandidate._id,
        transactionHash: result.hash,
        blockNumber: result.blockNumber,
      });

      // Show successful transaction.
      setMsg(
        `Vote successful. Transaction: ${result.hash}`
      );
    } catch (error) {
      // Show blockchain/backend error.
      setMsg(
        error.reason ||
        error.response?.data?.message ||
        error.message ||
        'Vote failed.'
      );
    }
  };

  // Show loading state.
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <p>Loading election...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">

      {/* Page heading */}
      <h1 className="text-3xl font-bold mb-2">
        Cast Your Vote
      </h1>

      {/* Election information */}
      {election && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold">
            {election.title}
          </h2>

          {election.description && (
            <p className="text-slate-600 mt-1">
              {election.description}
            </p>
          )}

          <p className="text-sm text-slate-500 mt-2">
            Select one party/candidate.
          </p>
        </div>
      )}

      {/* No election */}
      {!election && (
        <div className="bg-white border rounded-xl p-6">
          No active election.
        </div>
      )}

      {/* Candidate/party cards */}
      {election && (
        <div className="grid md:grid-cols-2 gap-4">

          {candidates.map((candidate) => (
            <button
              key={candidate._id}
              type="button"
              onClick={() => {
                setSelectedCandidate(candidate);
                setMsg('');
              }}
              className={`text-left bg-white border-2 p-5 rounded-2xl transition ${
                selectedCandidate?._id === candidate._id
                  ? 'border-indigo-600 bg-indigo-50'
                  : 'border-slate-200 hover:border-indigo-400'
              }`}
            >

              {/* Selection indicator */}
              <div className="flex items-start justify-between">

                <div>
                  {/* Party name */}
                  <h3 className="text-xl font-bold">
                    {candidate.partyName || candidate.party || 'Independent'}
                  </h3>

                  {/* Candidate name */}
                  <p className="font-medium text-slate-700 mt-1">
                    Candidate: {candidate.name}
                  </p>
                </div>

                {/* Selected indicator */}
                <div className="text-2xl">
                  {selectedCandidate?._id === candidate._id
                    ? '✓'
                    : '○'}
                </div>
              </div>

              {/* Candidate description */}
              {candidate.description && (
                <p className="text-sm text-slate-600 mt-4">
                  {candidate.description}
                </p>
              )}

              {/* Party symbol if your backend has one */}
              {candidate.symbol && (
                <div className="mt-4 text-sm">
                  Symbol: {candidate.symbol}
                </div>
              )}

            </button>
          ))}

        </div>
      )}

      {/* Confirmation section */}
      {selectedCandidate && !msg.includes('Vote successful') && (
        <div className="mt-8 bg-slate-50 border rounded-2xl p-6">

          <h2 className="text-xl font-bold">
            Confirm your vote
          </h2>

          <p className="mt-3">
            You selected:
          </p>

          <p className="text-lg font-semibold mt-1">
            {selectedCandidate.partyName ||
              selectedCandidate.party ||
              'Independent'}
          </p>

          <p className="text-slate-600">
            {selectedCandidate.name}
          </p>

          <p className="text-sm text-red-600 mt-4">
            ⚠️ Once submitted to the blockchain, this vote
            cannot be changed.
          </p>

          <button
            type="button"
            onClick={vote}
            className="mt-5 bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700"
          >
            Confirm Vote
          </button>

        </div>
      )}

      {/* Result/status message */}
      {msg && (
        <div className="mt-6 bg-slate-100 border rounded-xl p-4 break-all">
          {msg}
        </div>
      )}

    </div>
  );
}