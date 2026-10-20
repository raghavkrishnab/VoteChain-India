// Messages signed in MetaMask. The frontend (src/services/blockchain.js) must
// build exactly the same strings or signature recovery will fail.

export const loginMessage = (nonce) => `Blockchain Voting Login\nNonce: ${nonce}`;

export const registrationMessage = (walletAddress, email) =>
  `Blockchain Voting Registration\nWallet: ${walletAddress.toLowerCase()}\nEmail: ${email.toLowerCase()}`;
