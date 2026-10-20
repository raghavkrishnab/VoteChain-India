import { ethers } from 'ethers';
import abi from '../config/contractAbi';
import { CHAIN_ID, CONTRACT_ADDRESS } from '../config/config';

export async function connectWallet() {
  if (!window.ethereum) throw new Error('MetaMask is not installed.');
  const provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send('eth_requestAccounts', []);
  const network = await provider.getNetwork();
  if (network.chainId !== CHAIN_ID) throw new Error('Wrong network. Switch MetaMask to Ethereum Sepolia.');
  const signer = await provider.getSigner();
  return { address: await signer.getAddress(), provider, signer };
}
export function getContract(signerOrProvider) { if (!CONTRACT_ADDRESS) throw new Error('Contract address is not configured.'); return new ethers.Contract(CONTRACT_ADDRESS, abi, signerOrProvider); }
export async function signNonce(address, nonce) { const { signer } = await connectWallet(); if ((await signer.getAddress()).toLowerCase() !== address.toLowerCase()) throw new Error('Connected wallet does not match the account.'); return signer.signMessage(`Blockchain Voting Login\nNonce: ${nonce}`); }
export async function castVote(candidateId) { const { signer } = await connectWallet(); const contract = getContract(signer); const tx = await contract.castVote(candidateId); const receipt = await tx.wait(); return { hash: receipt.hash, blockNumber: receipt.blockNumber }; }
export async function registerOnChain(voter) { const { signer } = await connectWallet(); const contract = getContract(signer); const tx = await contract.registerVoter(voter); return tx.wait(); }
export async function addCandidateOnChain(id, name) { const { signer } = await connectWallet(); const tx = await getContract(signer).addCandidate(id, name); return tx.wait(); }
export async function startElectionOnChain() { const { signer } = await connectWallet(); const tx = await getContract(signer).startElection(); return tx.wait(); }
export async function endElectionOnChain() { const { signer } = await connectWallet(); const tx = await getContract(signer).endElection(); return tx.wait(); }
export async function getResultsOnChain() { const { provider } = await connectWallet(); return getContract(provider).getResults(); }
export async function hasVotedOnChain(address) { const { provider } = await connectWallet(); return getContract(provider).hasVoted(address); }
