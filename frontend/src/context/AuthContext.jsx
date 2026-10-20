import { createContext, useCallback, useContext, useEffect, useState } from 'react';

import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('jwt');
    setUser(null);
  }, []);

  // Re-reads the user from the backend, e.g. after verification or admin approval.
  const refreshUser = useCallback(async () => {
    const { data } = await api.get('/auth/me');
    setUser(data.user);
    return data.user;
  }, []);

  useEffect(() => {
    if (!localStorage.getItem('jwt')) {
      setLoading(false);
      return;
    }
    refreshUser()
      .catch(logout)
      .finally(() => setLoading(false));
  }, [refreshUser, logout]);

  const startSession = ({ token, user: sessionUser }) => {
    localStorage.setItem('jwt', token);
    setUser(sessionUser);
    return sessionUser;
  };

  const login = async (email, password) => startSession((await api.post('/auth/login', { email, password })).data);

  const walletLogin = async () => {
    // Loaded on demand so ethers is not part of the initial bundle.
    const { connectWallet, signLoginNonce } = await import('../services/blockchain');
    const { address } = await connectWallet();
    const { data } = await api.post('/auth/nonce', { walletAddress: address });
    const signature = await signLoginNonce(address, data.nonce);
    return startSession((await api.post('/auth/verify-signature', { walletAddress: address, signature })).data);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, walletLogin, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

export const isEligibleToVote = (user) =>
  user?.role === 'voter' &&
  user.documentStatus === 'approved' &&
  user.verificationStatus === 'verified' &&
  user.eligibilityStatus === 'eligible';
