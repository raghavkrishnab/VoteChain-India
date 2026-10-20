# API

Base URL `http://localhost:5000/api`. Authenticated routes need `Authorization: Bearer <jwt>`. Errors are JSON: `{ "message": "..." }`.

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/health` | – | Liveness |
| POST | `/auth/register` | – | multipart: `name, email, password, demoVoterId, walletAddress, walletSignature, consent, document, referenceFace` |
| POST | `/auth/login` | – | `{ email, password }` |
| POST | `/auth/nonce` | – | `{ walletAddress }` → `{ nonce }` |
| POST | `/auth/verify-signature` | – | `{ walletAddress, signature }` → `{ token, user }` |
| GET | `/auth/me` | user | Current user |
| POST | `/verification/face` | voter | multipart `image` (live photo); compared with the stored reference face and document |
| GET | `/elections` | – | Elections on the configured contract |
| GET | `/elections/:id` | – | |
| GET | `/elections/:id/candidates` | – | |
| GET | `/elections/:id/results` | – | Vote counts read from the contract |
| POST | `/elections` | admin | `{ title, description, chainElectionId }`; election must already exist on-chain |
| POST | `/elections/:id/candidates` | admin | `{ partyName, name, partySymbol, description, candidateIdentifier }`; must already exist on-chain |
| PATCH | `/elections/:id/start`, `/elections/:id/end` | admin | Syncs status from the chain |
| GET | `/voters` | admin | Voter list |
| PATCH | `/voters/:id/approval` | admin | `{ decision }` = `approved` or `rejected`; approval requires passed AI checks and an on-chain registered wallet |
| DELETE | `/voters/:id` | admin | Deletes the account and its uploaded files; the wallet must first be removed on-chain with `unregisterVoters` |
| POST | `/voting/transaction` | user | `{ electionId, transactionHash }`; the receipt is verified on-chain |
| GET | `/voting/status/:electionId` | user | Whether this user's vote is recorded |
| GET | `/audit`, `/audit/:transactionHash` | user | Recorded votes |

Signed MetaMask messages must match byte-for-byte in `backend/src/utils/messages.js` and `frontend/src/services/blockchain.js`:

- Login: `Blockchain Voting Login\nNonce: <nonce>`
- Registration: `Blockchain Voting Registration\nWallet: <lowercase address>\nEmail: <lowercase email>`
