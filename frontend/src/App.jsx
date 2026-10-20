// Import React Router components used for page navigation.
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

// Import authentication provider and authentication hook.
import {
  AuthProvider,
  useAuth,
} from './context/AuthContext';

// Import the common layout for protected pages.
import Layout from './layouts/Layout';

// Import all application pages.
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Verify from './pages/Verify';
import Vote from './pages/Vote';
import Results from './pages/Results';
import Audit from './pages/Audit';
import Admin from './pages/Admin';
import Generic from './pages/Generic';


// ============================================================
// GENERAL PROTECTED ROUTE
// ============================================================

// Protect pages that require authentication.
function Protected({ children }) {
  const { user, loading } = useAuth();

  // Wait until authentication checking is complete.
  if (loading) {
    return <div>Loading...</div>;
  }

  // If the user is not logged in, send them to login.
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Logged-in users can access the protected page.
  return <Layout>{children}</Layout>;
}


// ============================================================
// VOTING PROTECTED ROUTE
// ============================================================

// Protect the voting page.
//
// A voter must satisfy ALL THREE conditions:
// 1. Document approved
// 2. Face/identity verification completed
// 3. Voter is eligible
function VotingProtected({ children }) {
  const { user, loading } = useAuth();

  // Wait until authentication checking is complete.
  if (loading) {
    return <div>Loading...</div>;
  }

  // User is not logged in.
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Admins can access the voting page without voter verification.
  if (user.role === 'admin') {
    return <Layout>{children}</Layout>;
  }

  // Check all voter eligibility conditions.
  const isEligible =
    user.documentStatus === 'approved' &&
    user.verificationStatus === 'verified' &&
    user.eligibilityStatus === 'eligible';

  // If even one condition is not satisfied,
  // send the voter to the verification page.
  if (!isEligible) {
    return <Navigate to="/verify" replace />;
  }

  // All conditions passed.
  return <Layout>{children}</Layout>;
}


// ============================================================
// MAIN APPLICATION
// ============================================================

export default function App() {
  return (
    <AuthProvider>

      {/* Enable browser-based routing. */}
      <BrowserRouter>

        {/* Define all application routes. */}
        <Routes>

          {/* ==================================================
              PUBLIC ROUTES
              ================================================== */}

          {/* Landing page. */}
          <Route
            path="/"
            element={<Landing />}
          />

          {/* Login page. */}
          <Route
            path="/login"
            element={<Login />}
          />

          {/* Registration page. */}
          <Route
            path="/register"
            element={<Register />}
          />


          {/* ==================================================
              VOTER / PROTECTED ROUTES
              ================================================== */}

          {/* Dashboard. */}
          <Route
            path="/dashboard"
            element={
              <Protected>
                <Dashboard />
              </Protected>
            }
          />

          {/* Verification / eligibility page. */}
          <Route
            path="/verify"
            element={
              <Protected>
                <Verify />
              </Protected>
            }
          />

          {/* 
            Voting page.

            IMPORTANT:
            This uses VotingProtected instead of Protected.

            Therefore:
            pending/rejected/not-eligible voters
            cannot directly access /vote.
          */}
          <Route
            path="/vote"
            element={
              <VotingProtected>
                <Vote />
              </VotingProtected>
            }
          />

          {/* Election results. */}
          <Route
            path="/results"
            element={
              <Protected>
                <Results />
              </Protected>
            }
          />

          {/* Audit page. */}
          <Route
            path="/audit"
            element={
              <Protected>
                <Audit />
              </Protected>
            }
          />

          {/* Election page. */}
          <Route
            path="/election"
            element={
              <Protected>
                <Generic title="Election" />
              </Protected>
            }
          />

          {/* Transaction details page. */}
          <Route
            path="/transaction/:hash"
            element={
              <Protected>
                <Generic title="Transaction" />
              </Protected>
            }
          />

          {/* Blockchain verification page. */}
          <Route
            path="/blockchain"
            element={
              <Protected>
                <Generic title="Blockchain Verification" />
              </Protected>
            }
          />


          {/* ==================================================
              ADMIN ROUTES
              ================================================== */}

          {/* Main admin page. */}
          <Route
            path="/admin"
            element={
              <Protected>
                <Admin />
              </Protected>
            }
          />

          {/* Admin voters page. */}
          <Route
            path="/admin/voters"
            element={
              <Protected>
                <Admin />
              </Protected>
            }
          />

          {/* Admin elections page. */}
          <Route
            path="/admin/elections"
            element={
              <Protected>
                <Admin />
              </Protected>
            }
          />

          {/* Admin candidates page. */}
          <Route
            path="/admin/candidates"
            element={
              <Protected>
                <Admin />
              </Protected>
            }
          />

          {/* Admin audit page. */}
          <Route
            path="/admin/audit"
            element={
              <Protected>
                <Audit />
              </Protected>
            }
          />

        </Routes>

      </BrowserRouter>

    </AuthProvider>
  );
}