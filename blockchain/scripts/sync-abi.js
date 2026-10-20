import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const artifact = path.join(here, '..', 'artifacts', 'contracts', 'Voting.sol', 'Voting.json');
const root = path.join(here, '..', '..');

if (!fs.existsSync(artifact)) {
  console.error('Compile the contract first with npm run compile.');
  process.exit(1);
}

const abi = JSON.parse(fs.readFileSync(artifact, 'utf8')).abi;
const json = JSON.stringify(abi, null, 2);

// The frontend and backend both talk to the contract, so both get the same ABI.
fs.writeFileSync(
  path.join(root, 'frontend', 'src', 'config', 'contractAbi.js'),
  `// Generated from Hardhat artifact by blockchain/scripts/sync-abi.js. Do not edit manually.\nexport default ${json};\n`
);
fs.writeFileSync(path.join(root, 'backend', 'src', 'config', 'contractAbi.json'), `${json}\n`);

console.log('ABI synced to frontend and backend.');
