export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '';
export const CHAIN_ID = BigInt(import.meta.env.VITE_CHAIN_ID || 11155111);
export const NETWORK_NAME = import.meta.env.VITE_NETWORK_NAME || 'Ethereum Sepolia';
export const EXPLORER_URL = import.meta.env.VITE_EXPLORER_URL || 'https://sepolia.etherscan.io';
