# Demo Guide

Follow the demo flow in [SETUP.md](../SETUP.md#7-demo-flow). Highlights to show:

1. Wallet-signed registration, then AI verification against the registered reference face.
2. The admin registers the wallet on-chain and approves the voter.
3. The admin creates an election, adds candidates and starts it (each step is a Sepolia transaction).
4. The voter casts a vote; show the transaction on Etherscan from the Audit page.
5. A second vote attempt is rejected by the contract (`Already voted`).
6. Results are read live from the contract.
