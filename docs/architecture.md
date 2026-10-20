# Architecture

- **Frontend → MetaMask → Voting.sol (Sepolia):** every state change on-chain: register voter, create election, add candidate, start, end, vote.
- **Frontend → Backend:** application data (accounts, election titles, party details, audit index).
- **Backend → Sepolia RPC (read-only):** syncs election status and candidates from the chain, verifies vote receipts (`VoteCast` log, voter, election), reads results and voter registration.
- **Backend → AI service:** sends the live photo plus the stored reference face and document for each verification.
- **Backend → MongoDB Atlas:** users, elections, candidates, verified vote records.

Each write follows the pattern "transaction first, then the backend syncs from the chain". If a sync fails after the transaction succeeded, retrying the action is safe: the transaction reverts as already done, and the sync still succeeds.
