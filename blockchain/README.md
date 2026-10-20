# Blockchain

Hardhat project for Ethereum Sepolia. The deployer becomes the contract admin. The contract itself enforces voter registration, one-vote-per-wallet, candidate validation and election state.

Commands:

```powershell
npm install
npm test
npm run compile
npm run deploy
npm run sync-abi
```

The deployment wallet private key is used only by Hardhat. Never expose it to frontend or backend APIs.
