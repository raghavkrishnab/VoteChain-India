import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [elections, setElections] = useState([]);

  useEffect(() => {
    api
      .get('/elections')
      .then((response) => {
        setElections(response.data.elections || []);
      })
      .catch(() => {
        setElections([]);
      });
  }, []);

  const activeElection = elections.find(
    (election) => election.status === 'active'
  );

  const verified = user?.verificationStatus === 'verified';
  const eligible = user?.eligibilityStatus === 'eligible';

  const handleVote = () => {
    if (!verified || !eligible) {
      navigate('/verify');
      return;
    }

    navigate('/vote');
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <p className="text-indigo-400 text-sm font-medium">
          Voting Dashboard
        </p>

        <h1 className="text-4xl font-bold text-white mt-1">
          Welcome, {user?.name || 'Voter'}
        </h1>

        <p className="text-slate-400 mt-2">
          Manage your verification and participate in active elections.
        </p>
      </div>

      {/* Main election card */}
      <div className="rounded-3xl bg-gradient-to-r from-indigo-700 to-violet-700 p-7 text-white shadow-xl">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">

          <div>
            <p className="text-indigo-200 text-sm font-medium">
              ACTIVE ELECTION
            </p>

            <h2 className="text-3xl font-bold mt-2">
              {activeElection
                ? activeElection.title
                : 'No Active Election'}
            </h2>

            <p className="text-indigo-100 mt-2">
              {activeElection
                ? 'Your vote will be recorded on the blockchain.'
                : 'There is currently no election available for voting.'}
            </p>
          </div>

          <button
            onClick={handleVote}
            disabled={!activeElection}
            className="bg-white text-indigo-700 px-6 py-3 rounded-xl font-bold hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {verified && eligible
              ? 'Cast Your Vote →'
              : 'Verify to Vote →'}
          </button>

        </div>
      </div>

      {/* Status cards */}
      <div className="grid md:grid-cols-3 gap-4">

        {/* Account */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">

          <div className="text-2xl mb-3">
            👤
          </div>

          <p className="text-slate-400 text-sm">
            Account
          </p>

          <h3 className="text-white font-semibold mt-1">
            {user?.name}
          </h3>

          <p className="text-slate-500 text-sm mt-1">
            {user?.email}
          </p>

        </div>

        {/* Verification */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">

          <div className="text-2xl mb-3">
            🪪
          </div>

          <p className="text-slate-400 text-sm">
            Verification
          </p>

          <div className="flex items-center justify-between mt-2">

            <h3 className="text-white font-semibold">
              {user?.verificationStatus || 'pending'}
            </h3>

            {!verified && (
              <button
                onClick={() => navigate('/verify')}
                className="text-indigo-400 text-sm"
              >
                Verify
              </button>
            )}

          </div>

        </div>

        {/* Eligibility */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">

          <div className="text-2xl mb-3">
            ✓
          </div>

          <p className="text-slate-400 text-sm">
            Voting Eligibility
          </p>

          <h3 className="text-white font-semibold mt-2">
            {user?.eligibilityStatus || 'pending'}
          </h3>

        </div>

      </div>

      {/* Elections */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

        <div className="flex items-center justify-between mb-5">

          <div>
            <h2 className="text-xl font-bold text-white">
              Elections
            </h2>

            <p className="text-slate-500 text-sm mt-1">
              Elections available in the system
            </p>
          </div>

          <span className="text-sm text-slate-500">
            {elections.length} total
          </span>

        </div>

        {elections.length === 0 ? (

          <div className="border border-dashed border-slate-700 rounded-xl p-8 text-center">

            <div className="text-4xl mb-3">
              🗳️
            </div>

            <p className="text-slate-400">
              No elections found.
            </p>

          </div>

        ) : (

          <div className="space-y-3">

            {elections.map((election) => (

              <div
                key={election._id}
                className="flex items-center justify-between border border-slate-800 rounded-xl p-4 hover:border-indigo-500 transition"
              >

                <div>
                  <h3 className="text-white font-medium">
                    {election.title}
                  </h3>

                  <p className="text-slate-500 text-sm mt-1">
                    Status: {election.status}
                  </p>
                </div>

                <span
                  className={
                    election.status === 'active'
                      ? 'text-green-400 text-sm'
                      : 'text-slate-500 text-sm'
                  }
                >
                  {election.status}
                </span>

              </div>

            ))}

          </div>

        )}

      </div>

    </div>
  );
}