import { ethers } from 'ethers';
import abi from '../config/contractAbi';
import { CHAIN_ID, CONTRACT_ADDRESS, IS_LOCAL_CHAIN, NETWORK_NAME, RPC_URL } from '../config/config';

// Must match backend/src/utils/messages.js exactly.
const loginMessage = (nonce) => `Blockchain Voting Login\nNonce: ${nonce}`;
const registrationMessage = (walletAddress, email) =>
  `Blockchain Voting Registration\nWallet: ${walletAddress.toLowerCase()}\nEmail: ${email.toLowerCase()}`;

async function switchToExpectedNetwork() {
  const chainId = `0x${CHAIN_ID.toString(16)}`;
  try {
    await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId }] });
  } catch (e) {
    // 4902: MetaMask doesn't know this network yet (e.g. the local Hardhat chain), so offer to add it.
    if (e.code !== 4902) throw new Error(`Wrong network. Switch MetaMask to ${NETWORK_NAME}.`);
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{ chainId, chainName: NETWORK_NAME, rpcUrls: [RPC_URL], nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 } }],
    });
  }
}

export async function connectWallet() {
  if (!window.ethereum) throw new Error('MetaMask is not installed.');
  let provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send('eth_requestAccounts', []);
  if ((await provider.getNetwork()).chainId !== CHAIN_ID) {
    await switchToExpectedNetwork();
    // An ethers provider is bound to the network it first saw.
    provider = new ethers.BrowserProvider(window.ethereum);
  }
  const signer = await provider.getSigner();
  return { address: (await signer.getAddress()).toLowerCase(), provider, signer };
}

async function connectContract() {
  if (!CONTRACT_ADDRESS) throw new Error('Contract address is not configured (VITE_CONTRACT_ADDRESS).');
  const { signer, address } = await connectWallet();
  return { contract: new ethers.Contract(CONTRACT_ADDRESS, abi, signer), address };
}

async function send(method, ...args) {
  const { contract } = await connectContract();
  const receipt = await (await contract[method](...args)).wait();
  return { contract, receipt };
}

async function signAs(expectedAddress, message) {
  const { signer, address } = await connectWallet();
  if (address !== expectedAddress.toLowerCase()) throw new Error('The connected MetaMask account does not match this wallet.');
  return signer.signMessage(message);
}

export const signLoginNonce = (address, nonce) => signAs(address, loginMessage(nonce));
export const signRegistration = (address, email) => signAs(address, registrationMessage(address, email));

// ---- Admin transactions (must be sent from the contract's admin wallet) ----

export async function createElectionOnChain() {
  const { contract, receipt } = await send('createElection');
  for (const log of receipt.logs) {
    const parsed = contract.interface.parseLog(log);
    if (parsed?.name === 'ElectionCreated') return Number(parsed.args.electionId);
  }
  throw new Error('ElectionCreated event not found in transaction receipt.');
}

export const addCandidateOnChain = (chainElectionId, candidateId, name) =>
  send('addCandidate', chainElectionId, candidateId, name);
export const startElectionOnChain = (chainElectionId) => send('startElection', chainElectionId);
export const endElectionOnChain = (chainElectionId) => send('endElection', chainElectionId);

export async function registerVoterOnChain(walletAddress) {
  const { contract } = await connectContract();
  if (!(await contract.registeredVoter(walletAddress))) await (await contract.registerVoter(walletAddress)).wait();

  // On the local chain, also give the voter test ETH to pay for their vote.
  if (IS_LOCAL_CHAIN) {
    const signer = contract.runner;
    if ((await signer.provider.getBalance(walletAddress)) < ethers.parseEther('1')) {
      await (await signer.sendTransaction({ to: walletAddress, value: ethers.parseEther('10') })).wait();
    }
  }
}

// ---- Voter transactions ----

export async function castVoteOnChain(chainElectionId, candidateId, accountWallet) {
  const { contract, address } = await connectContract();
  if (address !== accountWallet.toLowerCase()) {
    throw new Error(`MetaMask is using ${address}, but your account's wallet is ${accountWallet}. Switch accounts in MetaMask.`);
  }
  if (await contract.hasVoted(chainElectionId, address)) throw new Error('This wallet has already voted in this election.');
  const receipt = await (await contract.castVote(chainElectionId, candidateId)).wait();
  return { hash: receipt.hash, blockNumber: receipt.blockNumber };
}
