import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import api, { errorMessage } from '../services/api';
import AuthShell from '../components/AuthShell';
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
    <AuthShell
      title="Register as a voter"
      subtitle="Use fictional demo details and consented test images only."
      footer={<>Already registered? <Link className="text-brand-700 font-semibold hover:underline" to="/login">Sign in</Link></>}
    >
      <form onSubmit={submit} className="space-y-4">
        {FIELDS.map(([name, label, type]) => (
          <label key={name} className="block">
            <span className="text-sm font-medium text-slate-700">{label}</span>
            <input
              className={`${inputClass} mt-1`}
              name={name}
              type={type}
              minLength={name === 'password' ? 8 : undefined}
              value={form[name]}
              onChange={(e) => setForm({ ...form, [name]: e.target.value })}
              required
            />
          </label>
        ))}

        <div>
          <span className="text-sm font-medium text-slate-700">MetaMask wallet</span>
          <div className="flex gap-2 mt-1">
            <input className={`${inputClass} bg-slate-50 font-mono text-sm`} value={wallet} placeholder="Not connected" readOnly />
            <Button type="button" variant="saffron" onClick={connect}>{wallet ? 'Change' : 'Connect'}</Button>
          </div>
          <span className="text-xs text-slate-500">This wallet is your voter identity. Use a different account from the admin's.</span>
        </div>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Demo ID document</span>
          <input className={`${inputClass} mt-1 text-sm`} type="file" accept="image/jpeg,image/png,image/webp,image/bmp,application/pdf" onChange={(e) => setDocument(e.target.files[0] || null)} required />
          <span className="text-xs text-slate-500">Must show a real date of birth, e.g. “Date of Birth: 15 AUG 1995”. JPG, PNG, WEBP, BMP or PDF, up to 5 MB.</span>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Reference face photo</span>
          <input className={`${inputClass} mt-1 text-sm`} type="file" accept="image/jpeg,image/png,image/webp,image/bmp" onChange={(e) => setReferenceFace(e.target.files[0] || null)} required />
          <span className="text-xs text-slate-500">A clear, front-facing photo. Your live photo is compared with it later.</span>
        </label>

        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input type="checkbox" className="mt-1 accent-brand-700" checked={consent} onChange={(e) => setConsent(e.target.checked)} required />
          <span>I consent to using these images for this educational prototype.</span>
        </label>

        <Button type="submit" className="w-full py-3" disabled={busy}>{busy ? 'Registering…' : 'Create voter account'}</Button>
        <Alert kind={msg.kind}>{msg.text}</Alert>
      </form>
    </AuthShell>
  );
}
