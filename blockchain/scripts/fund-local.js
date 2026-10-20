// Sends local test ETH from the Hardhat node's first account.
//   npm run fund:local -- 0xYourWallet [amount]
import { ethers } from 'ethers';

const [to, amount = '100'] = process.argv.slice(2);
if (!ethers.isAddress(to)) {
  console.error('Usage: npm run fund:local -- <wallet address> [amount in ETH]');
  process.exit(1);
}

const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
const signer = await provider.getSigner(0);
await (await signer.sendTransaction({ to, value: ethers.parseEther(amount) })).wait();
console.log(`Sent ${amount} ETH to ${to}. Balance: ${ethers.formatEther(await provider.getBalance(to))} ETH`);
