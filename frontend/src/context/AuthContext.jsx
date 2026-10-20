import { createContext, useContext, useEffect, useState } from 'react';

import api from '../services/api';

import { connectWallet, signNonce } from '../services/blockchain';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {

  // Stores the currently logged-in user.
  const [user, setUser] = useState(null);

  // Stores the connected MetaMask wallet address.
  const [wallet, setWallet] = useState('');

  // Tells the app whether we are still checking the saved JWT.
  const [loading, setLoading] = useState(true);

  // Check whether the user already has a valid JWT when the app starts.
  useEffect(() => {

    // Get the JWT saved in the browser.
    const token = localStorage.getItem('jwt');

    // If there is no JWT, authentication checking is finished.
    if (!token) {
      setLoading(false);
      return;
    }

    // Ask the backend who the logged-in user is.
    api.get('/auth/me')
      .then((r) => {

        // Save the user returned by the backend.
        setUser(r.data.user);

      })
      .catch(() => {

        // Remove an invalid or expired JWT.
        localStorage.removeItem('jwt');

        // Make sure no invalid user remains.
        setUser(null);

      })
      .finally(() => {

        // Authentication checking is now finished.
        setLoading(false);

      });

  }, []);

  // Normal email/password login.
  const login = async (email, password) => {

    // Send login credentials to the backend.
    const r = await api.post('/auth/login', {
      email,
      password
    });

    // Save the JWT in the browser.
    localStorage.setItem('jwt', r.data.token);

    // Save the logged-in user.
    setUser(r.data.user);

    // Return backend response.
    return r.data;
  };

  // MetaMask wallet login.
  const walletLogin = async () => {

    // Connect MetaMask and get the wallet address.
    const { address } = await connectWallet();

    // Request a nonce from the backend.
    const n = await api.post('/auth/nonce', {
      walletAddress: address
    });

    // Sign the nonce using MetaMask.
    const sig = await signNonce(address, n.data.nonce);

    // Send the signed nonce to the backend for verification.
    const r = await api.post('/auth/verify-signature', {
      walletAddress: address,
      signature: sig
    });

    // Save the JWT returned by the backend.
    localStorage.setItem('jwt', r.data.token);

    // Save the authenticated user.
    setUser(r.data.user);

    // Save the connected wallet address.
    setWallet(address);

    // Return backend response.
    return r.data;
  };

  // Logout the current user.
  const logout = () => {

    // Remove the saved JWT.
    localStorage.removeItem('jwt');

    // Clear the user.
    setUser(null);

    // Clear the wallet.
    setWallet('');

  };

  // Provide authentication data to the rest of the application.
  return (
    <AuthContext.Provider
      value={{
        user,
        wallet,
        loading,
        login,
        walletLogin,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook for accessing authentication state.
export const useAuth = () => useContext(AuthContext);