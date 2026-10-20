import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const artifact = path.join(here, '..', 'artifacts', 'contracts', 'Voting.sol', 'Voting.json');
const out = path.join(here, '..', '..', 'frontend', 'src', 'config', 'contractAbi.js');

if (!fs.existsSync(artifact)) {
  console.error('Compile the contract first with npm run compile.');
  process.exit(1);
}

const abi = JSON.parse(fs.readFileSync(artifact, 'utf8')).abi;

fs.writeFileSync(
  out,
  '// Generated from Hardhat artifact. Do not edit manually.\nexport default ' +
    JSON.stringify(abi, null, 2) +
    ';\n'
);

console.log('Frontend ABI synced.');
