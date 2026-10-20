import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { shortAddress } from './ui';

const link = ({ isActive }) => (isActive ? 'text-white font-semibold' : 'text-slate-300 hover:text-white');

export default function Nav() {
  const { user, logout } = useAuth();
  return (
    <nav className="bg-slate-950 text-white px-5 py-4 flex flex-wrap gap-x-5 gap-y-2 items-center">
      <NavLink className="font-bold mr-auto" to="/dashboard">⛓️ AI Voting</NavLink>
      <NavLink className={link} to="/dashboard">Dashboard</NavLink>
      {user.role === 'voter' && <NavLink className={link} to="/verify">Verify</NavLink>}
      {user.role === 'voter' && <NavLink className={link} to="/vote">Vote</NavLink>}
      <NavLink className={link} to="/results">Results</NavLink>
      <NavLink className={link} to="/audit">Audit</NavLink>
      {user.role === 'admin' && <NavLink className={link} to="/admin">Admin</NavLink>}
      <span className="text-xs text-slate-400" title={user.walletAddress}>{user.walletAddress ? shortAddress(user.walletAddress) : user.email}</span>
      <button onClick={logout} className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded">Logout</button>
    </nav>
  );
}
