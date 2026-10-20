import { useEffect, useState } from 'react';

export const METAMASK_HELP =
  'MetaMask was not found in this browser. Open this page in Chrome, Edge or Brave with the MetaMask extension installed (metamask.io/download), then reload.';

// MetaMask injects window.ethereum shortly after page load; wait briefly before deciding it's missing.
export function useHasWallet() {
  const [hasWallet, setHasWallet] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setHasWallet(!!window.ethereum), 600);
    return () => clearTimeout(timer);
  }, []);
  return hasWallet;
}

export default function MetaMaskNotice() {
  if (useHasWallet()) return null;
  return (
    <div className="border border-saffron-100 bg-saffron-50 text-saffron-700 rounded-xl p-4 text-sm">
      <p className="font-semibold">MetaMask not detected in this browser</p>
      <p className="mt-1">
        Voting uses the MetaMask browser extension. Open <b>{window.location.origin}</b> in Chrome, Edge or Brave where MetaMask is installed.
        Don't have it?{' '}
        <a className="underline font-semibold" href="https://metamask.io/download/" target="_blank" rel="noreferrer">Install MetaMask</a>, then reload this page.
      </p>
    </div>
  );
}
