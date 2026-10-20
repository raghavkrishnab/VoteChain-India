import 'dotenv/config';
import '@nomicfoundation/hardhat-toolbox';

export default {
  solidity: {
    version: '0.8.24',
    settings: { optimizer: { enabled: true, runs: 200 } },
  },
  networks: {
    sepolia: {
      // Hardhat refuses to run if the RPC URL points at a different chain
      // (e.g. an Ethereum mainnet URL), so nothing is ever sent with real ETH.
      chainId: 11155111,
      url: process.env.SEPOLIA_RPC_URL || '',
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
  etherscan: { apiKey: process.env.ETHERSCAN_API_KEY || '' },
};
