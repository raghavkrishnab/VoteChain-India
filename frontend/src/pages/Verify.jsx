// Import React hooks.
import { useState } from 'react';

// Import React Router navigation.
import { useNavigate } from 'react-router-dom';

// Import API service.
import api from '../services/api';

// Import authentication state.
import { useAuth } from '../context/AuthContext';

export default function Verify() {
  const navigate = useNavigate();

  const { user } = useAuth();

  const [live, setLive] = useState(null);
  const [reference, setReference] = useState(null);

  const [result, setResult] = useState(null);

  const [checking, setChecking] = useState(false);

  // ------------------------------------------------------------
  // CHECK CURRENT ELIGIBILITY
  // ------------------------------------------------------------

  const isDocumentApproved =
    user?.documentStatus === 'approved';

  const isFaceVerified =
    user?.verificationStatus === 'verified';

  const isEligible =
    user?.eligibilityStatus === 'eligible';

  const canVote =
    isDocumentApproved &&
    isFaceVerified &&
    isEligible;


  // ------------------------------------------------------------
  // AI FACE VERIFICATION
  // ------------------------------------------------------------

  const submit = async () => {
    if (!live || !reference) {
      setResult({
        error: 'Select both images',
      });

      return;
    }

    setChecking(true);
    setResult(null);

    const fd = new FormData();

    fd.append('image', live);
    fd.append('reference', reference);

    try {
      const r = await api.post(
        'http://localhost:8000/verify',
        fd,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      setResult(r.data);

    } catch (e) {
      setResult({
        error:
          e.response?.data?.detail ||
          e.response?.data?.message ||
          e.message,
      });
    } finally {
      setChecking(false);
    }
  };


  // ------------------------------------------------------------
  // STATUS DISPLAY HELPER
  // ------------------------------------------------------------

  const StatusRow = ({ title, status, successStatus }) => {
    const passed = status === successStatus;

    return (
      <div className="flex items-center justify-between border rounded-lg p-4 bg-white">
        <div>
          <p className="font-semibold">
            {title}
          </p>

          <p className="text-sm text-slate-500">
            Current status: {status || 'pending'}
          </p>
        </div>

        <span
          className={`px-3 py-1 rounded-full text-sm font-semibold ${
            passed
              ? 'bg-green-100 text-green-700'
              : status === 'rejected' || status === 'not_eligible'
                ? 'bg-red-100 text-red-700'
                : 'bg-yellow-100 text-yellow-700'
          }`}
        >
          {passed
            ? 'Passed'
            : status === 'rejected' || status === 'not_eligible'
              ? 'Failed'
              : 'Pending'}
        </span>
      </div>
    );
  };


  // ------------------------------------------------------------
  // PAGE
  // ------------------------------------------------------------

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Page heading */}
      <div>
        <h1 className="text-3xl font-bold">
          Voter Verification
        </h1>

        <p className="mt-2 text-sm text-slate-600">
          Complete all eligibility checks before accessing
          the election.
        </p>
      </div>


      {/* ------------------------------------------------------
          ELIGIBILITY STATUS
          ------------------------------------------------------ */}

      <div className="space-y-3">

        <h2 className="text-xl font-semibold">
          Eligibility Status
        </h2>

        <StatusRow
          title="Document Verification"
          status={user?.documentStatus}
          successStatus="approved"
        />

        <StatusRow
          title="AI Face Verification"
          status={user?.verificationStatus}
          successStatus="verified"
        />

        <StatusRow
          title="Voter Eligibility"
          status={user?.eligibilityStatus}
          successStatus="eligible"
        />

      </div>


      {/* ------------------------------------------------------
          AI VERIFICATION
          ------------------------------------------------------ */}

      <div className="bg-white border rounded-xl p-5 space-y-4">

        <h2 className="text-xl font-semibold">
          AI Face Verification
        </h2>

        <p className="text-sm text-slate-600">
          Use two consented demo images: a reference image
          and a current/live image. InsightFace compares
          their embeddings.
        </p>


        {/* Reference image */}

        <label className="block">

          <span className="font-medium">
            Reference image
          </span>

          <input
            className="block mt-2"
            type="file"
            accept="image/*"
            onChange={(e) =>
              setReference(e.target.files?.[0] || null)
            }
          />

        </label>


        {/* Live image */}

        <label className="block">

          <span className="font-medium">
            Current / live image
          </span>

          <input
            className="block mt-2"
            type="file"
            accept="image/*"
            onChange={(e) =>
              setLive(e.target.files?.[0] || null)
            }
          />

        </label>


        {/* Verify button */}

        <button
          onClick={submit}
          disabled={checking}
          className="bg-indigo-600 text-white px-5 py-2 rounded-lg disabled:opacity-50"
        >
          {checking
            ? 'Verifying...'
            : 'Verify Face'}
        </button>

      </div>


      {/* ------------------------------------------------------
          AI RESULT
          ------------------------------------------------------ */}

      {result && (
        <div className="space-y-3">

          <h2 className="text-xl font-semibold">
            Verification Result
          </h2>

          <pre className="bg-slate-900 text-white p-4 rounded-lg overflow-auto text-sm">
            {JSON.stringify(result, null, 2)}
          </pre>

        </div>
      )}


      {/* ------------------------------------------------------
          VOTE ACCESS
          ------------------------------------------------------ */}

      <div
        className={`border rounded-xl p-5 ${
          canVote
            ? 'bg-green-50 border-green-200'
            : 'bg-yellow-50 border-yellow-200'
        }`}
      >

        {canVote ? (
          <>
            <h2 className="text-xl font-semibold text-green-800">
              ✓ You are eligible to vote
            </h2>

            <p className="mt-2 text-sm text-green-700">
              All verification and eligibility checks have
              been completed.
            </p>

            <button
              onClick={() => navigate('/vote')}
              className="mt-4 bg-green-600 text-white px-5 py-2 rounded-lg"
            >
              Proceed to Vote
            </button>
          </>
        ) : (
          <>
            <h2 className="text-xl font-semibold text-yellow-800">
              Voting access is not available yet
            </h2>

            <p className="mt-2 text-sm text-yellow-700">
              You must pass all three checks before you can
              access the voting page.
            </p>

            <div className="mt-3 text-sm space-y-1">
              <p>
                Document:{' '}
                {isDocumentApproved ? '✓ Approved' : '⏳ Pending'}
              </p>

              <p>
                Face verification:{' '}
                {isFaceVerified ? '✓ Verified' : '⏳ Pending'}
              </p>

              <p>
                Eligibility:{' '}
                {isEligible ? '✓ Eligible' : '⏳ Pending'}
              </p>
            </div>
          </>
        )}

      </div>

    </div>
  );
}