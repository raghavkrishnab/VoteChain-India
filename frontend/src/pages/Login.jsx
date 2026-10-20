import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../services/api';
import AuthShell from '../components/AuthShell';
import { Alert, Button, inputClass } from '../components/ui';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, walletLogin } = useAuth();
  const navigate = useNavigate();

  const run = async (action, fallback) => {
    setErr('');
    setLoading(true);
    try {
      await action();
      navigate('/dashboard');
    } catch (error) {
      setErr(errorMessage(error, fallback));
    } finally {
      setLoading(false);
    }
  };

  const submit = (e) => {
    e.preventDefault();
    run(() => login(email, password), 'Login failed');
  };

  return (
    <AuthShell
      title="Sign in"
      subtitle="Voters usually sign in with MetaMask. The admin can use email and password."
      footer={<>New voter? <Link to="/register" className="text-brand-700 font-semibold hover:underline">Register here</Link></>}
    >
      <div className="space-y-5">
        <Alert kind="error">{err}</Alert>

        <Button type="button" variant="saffron" className="w-full py-3" onClick={() => run(walletLogin, 'Wallet login failed')} disabled={loading}>
          Sign in with MetaMask
        </Button>

        <div className="flex items-center gap-3 text-xs text-slate-400">
          <div className="flex-1 h-px bg-slate-200" />
          OR WITH EMAIL
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        <form onSubmit={submit} className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Email</span>
            <input type="email" autoComplete="email" className={`${inputClass} mt-1`} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Password</span>
            <input type="password" autoComplete="current-password" className={`${inputClass} mt-1`} value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          <Button type="submit" className="w-full py-3" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</Button>
        </form>
      </div>
    </AuthShell>
  );
}
