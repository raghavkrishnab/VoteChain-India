import { useEffect, useState } from 'react';
import api from '../services/api';

const LABELS = { database: 'Database', ai: 'AI service', blockchain: 'Blockchain' };

// Shows a banner only when the backend or one of its dependencies is down.
export default function SystemStatus() {
  const [problems, setProblems] = useState([]);

  useEffect(() => {
    let cancelled = false;
    const check = () =>
      api
        .get('/health')
        .then(({ data }) => Object.keys(LABELS).filter((k) => !data[k]?.ok).map((k) => `${LABELS[k]}: ${data[k]?.error || 'unavailable'}`))
        .catch(() => ['Backend API is not reachable on port 5000'])
        .then((list) => !cancelled && setProblems(list));
    check();
    const timer = setInterval(check, 30000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  if (!problems.length) return null;
  return (
    <div className="bg-amber-50 border-b border-amber-200 text-amber-800 text-sm px-5 py-2">
      ⚠️ Some services are unavailable — {problems.join(' · ')}
    </div>
  );
}
