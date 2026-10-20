// Deploys Voting.sol and writes the address/chain settings into the backend
// and frontend env files, then syncs the ABI.
//   Sepolia:      npm run deploy        -> updates backend/.env and frontend/.env
//   Local chain:  npm run deploy:local  -> writes backend/.env.localchain and
//                                          frontend/.env.localchain (your .env files are untouched)
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import hre from 'hardhat';

const { ethers, network } = hre;
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const LOCAL_CHAIN_ID = 31337n;

// Sets KEY=value lines in an env file, keeping every other line as-is.
function updateEnvFile(file, values) {
  let lines = fs.existsSync(file) ? fs.readFileSync(file, 'utf8').split(/\r?\n/) : [];
  for (const [key, value] of Object.entries(values)) {
    const i = lines.findIndex((l) => l.startsWith(`${key}=`));
    if (i >= 0) lines[i] = `${key}=${value}`;
    else lines.splice(lines.length && lines.at(-1) === '' ? lines.length - 1 : lines.length, 0, `${key}=${value}`);
  }
  if (lines.at(-1) !== '') lines.push('');
  fs.writeFileSync(file, lines.join('\n'));
  console.log(`Updated ${path.relative(root, file)}`);
}

const backendEnv = dotenv.config({ path: path.join(root, 'backend', '.env'), processEnv: {} }).parsed || {};
const [deployer] = await ethers.getSigners();
const { chainId } = await ethers.provider.getNetwork();
const isLocal = chainId === LOCAL_CHAIN_ID;

// The admin is the wallet you use in MetaMask; it defaults to the deployer.
const admin = ethers.isAddress(backendEnv.ADMIN_WALLET_ADDRESS) ? ethers.getAddress(backendEnv.ADMIN_WALLET_ADDRESS) : deployer.address;

const contract = await (await ethers.getContractFactory('Voting')).deploy(admin);
await contract.waitForDeployment();
const address = await contract.getAddress();

console.log(`Contract deployed to: ${address}`);
console.log(`Admin wallet: ${admin}`);
console.log(`Network: ${network.name} (chain ID ${chainId})`);

if (isLocal && admin !== deployer.address) {
  // Local test ETH so the admin can pay gas from MetaMask.
  await (await deployer.sendTransaction({ to: admin, value: ethers.parseEther('1000') })).wait();
  console.log(`Funded admin wallet with 1000 local ETH`);
}

const chain = isLocal
  ? { rpc: 'http://127.0.0.1:8545', name: 'Hardhat Local', explorer: '', suffix: '.localchain' }
  : { rpc: process.env.SEPOLIA_RPC_URL, name: 'Ethereum Sepolia', explorer: 'https://sepolia.etherscan.io', suffix: '' };

updateEnvFile(path.join(root, 'backend', `.env${chain.suffix}`), {
  BLOCKCHAIN_RPC_URL: chain.rpc,
  CHAIN_ID: chainId.toString(),
  CONTRACT_ADDRESS: address,
  // Local mode uses the MongoDB started by `npm run db:local`, not Atlas.
  ...(isLocal ? { MONGODB_URI: 'mongodb://127.0.0.1:27017/', MONGODB_DB_NAME: 'voting_localchain' } : {}),
});
updateEnvFile(path.join(root, 'frontend', `.env${chain.suffix}`), {
  VITE_CONTRACT_ADDRESS: address,
  VITE_CHAIN_ID: chainId.toString(),
  VITE_NETWORK_NAME: chain.name,
  VITE_RPC_URL: isLocal ? chain.rpc : 'https://rpc.sepolia.org',
  VITE_EXPLORER_URL: chain.explorer,
});
if (!isLocal) updateEnvFile(path.join(root, 'blockchain', '.env'), { CONTRACT_ADDRESS: address });

execFileSync(process.execPath, [path.join(root, 'blockchain', 'scripts', 'sync-abi.js')], { stdio: 'inherit' });
