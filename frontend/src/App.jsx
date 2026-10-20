import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider, useAuth, isEligibleToVote } from './context/AuthContext';
import Layout from './layouts/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';

// Pages behind login are split into separate chunks (they pull in ethers).
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Verify = lazy(() => import('./pages/Verify'));
const Vote = lazy(() => import('./pages/Vote'));
const Results = lazy(() => import('./pages/Results'));
const Audit = lazy(() => import('./pages/Audit'));
const Admin = lazy(() => import('./pages/Admin'));

const Loading = () => <div className="p-8 text-slate-500">Loading…</div>;

// role: restrict to 'admin' or 'voter'; eligible: voter must have passed every check.
function Protected({ children, role, eligible = false }) {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/dashboard" replace />;
  if (eligible && !isEligibleToVote(user)) return <Navigate to="/verify" replace />;
  return (
    <Layout>
      <Suspense fallback={<Loading />}>{children}</Suspense>
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
          <Route path="/verify" element={<Protected role="voter"><Verify /></Protected>} />
          <Route path="/vote" element={<Protected role="voter" eligible><Vote /></Protected>} />
          <Route path="/results" element={<Protected><Results /></Protected>} />
          <Route path="/audit" element={<Protected><Audit /></Protected>} />
          <Route path="/admin" element={<Protected role="admin"><Admin /></Protected>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
