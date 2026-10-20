import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import api, { errorMessage } from '../services/api';
import { useAuth, isEligibleToVote } from '../context/AuthContext';
import { Alert, Button, Card, StatusBadge, inputClass } from '../components/ui';

function useCamera() {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);

  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = stream;
    return () => stream?.getTracks().forEach((t) => t.stop());
  }, [stream]);

  const start = async () => setStream(await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } }));
  const stop = () => setStream(null);

  const capture = () =>
    new Promise((resolve) => {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);
      canvas.toBlob((blob) => resolve(new File([blob], 'live.jpg', { type: 'image/jpeg' })), 'image/jpeg', 0.92);
    });

  return { videoRef, active: !!stream, start, stop, capture };
}

export default function Verify() {
  const { user, setUser } = useAuth();
  const camera = useCamera();
  const [live, setLive] = useState(null);
  const [preview, setPreview] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!live) return setPreview('');
    const url = URL.createObjectURL(live);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [live]);

  const finalised = user.documentStatus === 'approved';
  const aiPassed = user.verificationStatus === 'verified' && user.eligibilityStatus === 'eligible';

  const startCamera = async () => {
    setError('');
    try {
      await camera.start();
    } catch (e) {
      setError(`Camera unavailable: ${e.message}. You can upload a photo instead.`);
    }
  };

  const takePhoto = async () => {
    setLive(await camera.capture());
    camera.stop();
  };

  const submit = async () => {
    setChecking(true);
    setError('');
    setResult(null);
    const fd = new FormData();
    fd.append('image', live);
    try {
      const { data } = await api.post('/verification/face', fd);
      setResult(data);
      setUser(data.user);
    } catch (e) {
      setError(errorMessage(e, 'Verification failed.'));
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Voter Verification</h1>
        <p className="mt-2 text-sm text-slate-600">
          A live photo is compared with the reference face you registered, and your date of birth is read from your demo document.
        </p>
      </div>

      <Card title="Status">
        <div className="grid sm:grid-cols-3 gap-3 text-sm">
          <div>AI face match<br /><StatusBadge status={user.verificationStatus} /></div>
          <div>Age 18+<br /><StatusBadge status={user.eligibilityStatus} /></div>
          <div>Admin approval<br /><StatusBadge status={user.documentStatus} /></div>
        </div>
      </Card>

      {!finalised && (
        <Card title={aiPassed ? 'Re-run verification (optional)' : 'Take a live photo'}>
          <div className="space-y-4">
            {camera.active ? (
              <div className="space-y-2">
                <video ref={camera.videoRef} autoPlay playsInline muted className="w-full rounded-lg bg-black" />
                <div className="flex gap-2">
                  <Button onClick={takePhoto}>📸 Capture</Button>
                  <Button variant="secondary" onClick={camera.stop}>Cancel</Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 items-center">
                <Button variant="secondary" onClick={startCamera}>Use camera</Button>
                <span className="text-sm text-slate-500">or</span>
                <input className={`${inputClass} flex-1`} type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setLive(e.target.files?.[0] || null)} />
              </div>
            )}

            {preview && <img src={preview} alt="Live capture preview" className="max-h-64 rounded-lg border" />}

            <Button onClick={submit} disabled={!live || checking}>{checking ? 'Verifying… (first run loads the AI model)' : 'Verify'}</Button>
            <Alert kind="error">{error}</Alert>
          </div>
        </Card>
      )}

      {result && (
        <Card title="Result">
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="text-slate-500">Face similarity</dt>
            <dd>{result.similarity} (needs ≥ {result.threshold}) {result.faceVerified ? '✅' : '❌'}</dd>
            <dt className="text-slate-500">Date of birth read</dt>
            <dd>{result.dateOfBirth || 'not found'}</dd>
            <dt className="text-slate-500">Age</dt>
            <dd>{result.age ?? '—'} {result.ageEligible ? '✅' : '❌'}</dd>
          </dl>
          <p className="text-xs text-slate-500 mt-3">Educational demo only; it does not prove identity, citizenship or legal eligibility.</p>
        </Card>
      )}

      {isEligibleToVote(user) ? (
        <Alert kind="success">
          You are eligible to vote. <Link to="/vote" className="font-semibold underline">Go to voting →</Link>
        </Alert>
      ) : aiPassed ? (
        <Alert>AI checks passed. Waiting for the admin to register your wallet on-chain and approve you.</Alert>
      ) : null}
    </div>
  );
}
