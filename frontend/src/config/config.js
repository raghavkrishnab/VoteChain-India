export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '';
export const CHAIN_ID = BigInt(import.meta.env.VITE_CHAIN_ID || 11155111);
export const NETWORK_NAME = import.meta.env.VITE_NETWORK_NAME || 'Ethereum Sepolia';
// Used to add the network to MetaMask if it is missing.
export const RPC_URL = import.meta.env.VITE_RPC_URL || 'https://rpc.sepolia.org';
// Empty on a local chain, where there is no block explorer.
export const EXPLORER_URL = import.meta.env.VITE_EXPLORER_URL ?? 'https://sepolia.etherscan.io';
export const IS_LOCAL_CHAIN = CHAIN_ID === 31337n;
