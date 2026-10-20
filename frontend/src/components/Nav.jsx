import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';
import { shortAddress } from './ui';

const link = ({ isActive }) =>
  `px-3 py-1.5 rounded-lg text-sm transition ${isActive ? 'bg-white/15 text-white font-semibold' : 'text-brand-100 hover:text-white hover:bg-white/10'}`;

export default function Nav() {
  const { user, logout } = useAuth();
  const isAdmin = user.role === 'admin';
  return (
    <header className="bg-brand-950 text-white">
      <nav className="max-w-6xl mx-auto px-5 py-3 flex flex-wrap gap-x-2 gap-y-2 items-center">
        <NavLink to="/dashboard" className="mr-auto"><Logo light /></NavLink>
        <NavLink className={link} to="/dashboard">Dashboard</NavLink>
        {!isAdmin && <NavLink className={link} to="/verify">Verify</NavLink>}
        {!isAdmin && <NavLink className={link} to="/vote">Vote</NavLink>}
        <NavLink className={link} to="/results">Results</NavLink>
        <NavLink className={link} to="/audit">Audit</NavLink>
        {isAdmin && <NavLink className={link} to="/admin">Admin</NavLink>}
        <span className="hidden sm:flex items-center gap-2 ml-2 pl-3 border-l border-white/15 text-xs text-brand-200" title={user.walletAddress || user.email}>
          <span className={`px-2 py-0.5 rounded-full font-semibold ${isAdmin ? 'bg-saffron-400 text-brand-950' : 'bg-india-500 text-white'}`}>
            {isAdmin ? 'Admin' : 'Voter'}
          </span>
          {user.walletAddress ? shortAddress(user.walletAddress) : user.email}
        </span>
        <button onClick={logout} className="ml-1 px-3 py-1.5 text-sm bg-white/10 hover:bg-white/20 rounded-lg">Log out</button>
      </nav>
      <div className="tricolor" />
    </header>
  );
}
