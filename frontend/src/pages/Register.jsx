import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import api, { errorMessage } from '../services/api';
import { Alert, Button, inputClass } from '../components/ui';

const FIELDS = [
  ['name', 'Full name (fictional)', 'text'],
  ['email', 'Email', 'email'],
  ['password', 'Password (min. 8 characters)', 'password'],
  ['demoVoterId', 'Demo voter ID', 'text'],
];

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', demoVoterId: '' });
  const [wallet, setWallet] = useState('');
  const [document, setDocument] = useState(null);
  const [referenceFace, setReferenceFace] = useState(null);
  const [consent, setConsent] = useState(false);
  const [msg, setMsg] = useState({ kind: 'info', text: '' });
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const blockchain = () => import('../services/blockchain');

  const connect = async () => {
    try {
      const { connectWallet } = await blockchain();
      setWallet((await connectWallet()).address);
    } catch (e) {
      setMsg({ kind: 'error', text: errorMessage(e) });
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!wallet) return setMsg({ kind: 'error', text: 'Connect your MetaMask wallet first.' });
    if (!document || !referenceFace) return setMsg({ kind: 'error', text: 'Upload both the demo document and reference face photo.' });

    setBusy(true);
    setMsg({ kind: 'info', text: 'Sign the registration message in MetaMask to prove you own this wallet…' });
    try {
      const { signRegistration } = await blockchain();
      const walletSignature = await signRegistration(wallet, form.email);

      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      fd.append('walletAddress', wallet);
      fd.append('walletSignature', walletSignature);
      fd.append('document', document);
      fd.append('referenceFace', referenceFace);
      fd.append('consent', String(consent));
      await api.post('/auth/register', fd);

      setMsg({ kind: 'success', text: 'Registered successfully. Redirecting to login…' });
      setTimeout(() => navigate('/login'), 1200);
    } catch (x) {
      setMsg({ kind: 'error', text: errorMessage(x) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto my-8 bg-white p-6 rounded-2xl border space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Demo Voter Registration</h1>
        <p className="text-sm text-slate-600 mt-1">Use only fictional demo voter details and consented test images.</p>
      </div>

      <form onSubmit={submit} className="space-y-3">
        {FIELDS.map(([name, placeholder, type]) => (
          <input
            key={name}
            className={inputClass}
            name={name}
            type={type}
            placeholder={placeholder}
            minLength={name === 'password' ? 8 : undefined}
            value={form[name]}
            onChange={(e) => setForm({ ...form, [name]: e.target.value })}
            required
          />
        ))}

        <div className="flex gap-2">
          <input className={`${inputClass} bg-slate-50`} value={wallet} placeholder="MetaMask wallet" readOnly />
          <Button type="button" variant="secondary" onClick={connect}>🦊 {wallet ? 'Change' : 'Connect'}</Button>
        </div>

        <label className="block">
          <span className="font-medium">Demo voter document</span>
          <input className={`${inputClass} mt-1`} type="file" accept="image/jpeg,image/png,image/webp,image/bmp,application/pdf" onChange={(e) => setDocument(e.target.files[0] || null)} required />
          <span className="text-xs text-slate-500">Must show a date of birth, e.g. “DOB: 15/08/2004”. JPG, PNG, WEBP, BMP or PDF, max 5 MB.</span>
        </label>

        <label className="block">
          <span className="font-medium">Reference face photo</span>
          <input className={`${inputClass} mt-1`} type="file" accept="image/jpeg,image/png,image/webp,image/bmp" onChange={(e) => setReferenceFace(e.target.files[0] || null)} required />
          <span className="text-xs text-slate-500">A clear, front-facing photo of the same demo person. It is compared with a live photo later.</span>
        </label>

        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" className="mt-1" checked={consent} onChange={(e) => setConsent(e.target.checked)} required />
          <span>I consent to using these images for this educational prototype.</span>
        </label>

        <Button type="submit" className="w-full py-3" disabled={busy}>{busy ? 'Registering…' : 'Create demo account'}</Button>
      </form>

      <Alert kind={msg.kind}>{msg.text}</Alert>
      <p className="text-center text-sm text-slate-500">Already registered? <Link className="text-indigo-600" to="/login">Sign in</Link></p>
    </div>
  );
}
