import { ethers } from 'ethers';

import abi from '../config/contractAbi.json' with { type: 'json' };
import { env } from '../config/env.js';
import { httpError } from '../utils/httpError.js';

// Mirrors the Status enum in Voting.sol.
export const ChainStatus = Object.freeze({ None: 0, Created: 1, Active: 2, Ended: 3 });

const iface = new ethers.Interface(abi);
let contract;

function getContract() {
  if (!env.BLOCKCHAIN_RPC_URL || !env.CONTRACT_ADDRESS) {
    throw httpError(503, 'Blockchain RPC or contract address is not configured on the server');
  }
  if (!contract) {
    const provider = new ethers.JsonRpcProvider(env.BLOCKCHAIN_RPC_URL, env.CHAIN_ID, { staticNetwork: true });
    contract = new ethers.Contract(env.CONTRACT_ADDRESS, abi, provider);
  }
  return contract;
}

export async function getElectionStatus(chainElectionId) {
  return Number(await getContract().getElectionStatus(chainElectionId));
}

export async function getResults(chainElectionId) {
  const [ids, names, counts, status] = await getContract().getResults(chainElectionId);
  return {
    status: Number(status),
    candidates: ids.map((id, i) => ({ candidateIdentifier: Number(id), name: names[i], votes: Number(counts[i]) })),
  };
}

export async function isRegisteredVoter(walletAddress) {
  return getContract().registeredVoter(walletAddress);
}

// Confirms that `transactionHash` is a successful castVote by `voter` in
// `chainElectionId` on our contract, and returns what the chain recorded.
export async function verifyVoteTransaction(transactionHash, { voter, chainElectionId }) {
  const receipt = await getContract().runner.provider.getTransactionReceipt(transactionHash);
  if (!receipt) throw httpError(404, 'Transaction not found or not yet mined');
  if (receipt.status !== 1) throw httpError(400, 'Transaction failed on-chain');

  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== env.CONTRACT_ADDRESS) continue;
    const parsed = iface.parseLog(log);
    if (parsed?.name !== 'VoteCast') continue;
    if (parsed.args.voter.toLowerCase() !== voter.toLowerCase()) {
      throw httpError(403, 'Transaction was not sent by your registered wallet');
    }
    if (Number(parsed.args.electionId) !== chainElectionId) {
      throw httpError(400, 'Transaction belongs to a different election');
    }
    return { candidateIdentifier: Number(parsed.args.candidateId), blockNumber: receipt.blockNumber };
  }
  throw httpError(400, 'Transaction does not contain a vote for this contract');
}
