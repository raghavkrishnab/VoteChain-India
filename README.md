# VoteChain India — Blockchain-Based AI Voting System

**Secure Remote Voting Prototype for Eligible Overseas Indian Electors**

A student-level educational prototype combining React, Express, MongoDB, FastAPI/InsightFace/Tesseract, Solidity, Hardhat, MetaMask and Ethereum Sepolia.

> **Educational Prototype Disclaimer:** This application uses synthetic/demo voter records and consent-based test faces. It does not connect to government voter databases, passport systems, or Election Commission of India infrastructure. AI verification is demonstrative and does not prove citizenship, identity, or legal voting eligibility. The blockchain implementation demonstrates integrity, auditability, and duplicate-vote prevention on Ethereum Sepolia. This prototype must not be used for real elections.

## How it works

1. **Register:** the voter connects MetaMask and signs a message to prove the wallet is theirs, then uploads a demo ID document and a face photo.
2. **Verify:** a live photo is matched against the registered face (InsightFace), and the date of birth is read from the ID (Tesseract OCR) to check the voter is 18+.
3. **Approve:** the admin adds the voter's wallet to the smart contract's voter list.
4. **Vote:** the voter casts one vote from MetaMask straight to the contract. A second vote from the same wallet is rejected by the contract itself.
5. **Results and audit:** counts are read live from the blockchain, and every vote links to its transaction.

```
React website ──REST──▶ Express API ──▶ MongoDB (accounts, elections, uploaded files)
     │                      │ ├──▶ FastAPI AI service: face match + OCR age check
     │                      │ └──▶ Blockchain RPC (read-only: verifies votes, reads results)
     └──MetaMask──▶ Voting.sol (all writes: admin actions and votes)
```

- **The contract is the source of truth** for voter authorisation, the election lifecycle, one vote per wallet, and vote counts. It supports multiple elections.
- **The backend never trusts the client about the chain.** It checks election status and candidates on-chain, confirms each vote's transaction receipt before recording it, and reads results directly from the contract.
- **Admins can delete voters.** The wallet is removed from the contract first, so a deleted account can't vote. Votes already cast stay counted.

## Project layout

| Folder | Contents | Tests |
|---|---|---|
| `blockchain/` | `Voting.sol`, deploy and ABI-sync scripts | `npm test` (Hardhat) |
| `backend/` | Express API, Mongoose models, chain and file-storage services | `npm test` (node:test) |
| `ai-service/` | FastAPI `/verify`, InsightFace, Tesseract OCR, Dockerfile | `pytest` |
| `frontend/` | React + Vite + Tailwind UI | `npm run build` |
| `demo-data/` | 5 fictional demo voters: AI-generated faces and specimen ID cards | |
| `docs/` | Architecture, API, security notes | |

## Run locally

After the one-time setup in **[SETUP.md](SETUP.md)** (copy the `.env` files and create the AI venv):

```powershell
.\start.ps1                   # local mode: everything on this PC, no test ETH or Atlas needed
.\start.ps1 -Network sepolia  # Sepolia testnet + MongoDB Atlas
```

Then open http://localhost:5173 in a browser with MetaMask. `GET http://localhost:5000/api/health` reports the database, AI service and blockchain status. To try the app, use the demo voters in [demo-data](demo-data/README.md).

## Deploy to Render

The hosted version runs on **Ethereum Sepolia** with **MongoDB Atlas**, defined in [`render.yaml`](render.yaml):

| Service | Render type | Notes |
|---|---|---|
| `votechain-india-web` | Static site | React build; all routes rewrite to `index.html` |
| `votechain-india-api` | Node web service | Express API; uploaded files are stored in MongoDB (GridFS) |
| `votechain-india-ai` | Docker web service | Tesseract + InsightFace `buffalo_s` (fits the free 512 MB plan); only the API can call it (shared token) |

1. **Your own accounts.** You need a [MongoDB Atlas](https://www.mongodb.com/atlas) cluster (Network Access: allow `0.0.0.0/0` so Render can connect), an [Alchemy](https://www.alchemy.com) Sepolia RPC URL, and a test-only MetaMask wallet funded with Sepolia ETH from a faucet.
2. **Deploy the contract.** Put `SEPOLIA_RPC_URL` and `PRIVATE_KEY` in `blockchain/.env`, then run `npm run deploy` in `blockchain/`. This writes the contract address into `render.yaml` and the `.env` files; commit and push it.
3. **Prepare the database** from your PC, with `MONGODB_URI` in `backend/.env` set to your Atlas cluster:
   ```bash
   npm run seed:admin
   ```
   Optionally, `npm run copy-voters` (with `npm run db:local` running) copies your local voters and their files into Atlas.
4. **Create the services.** In Render: **New → Blueprint**, select this repository, and enter `MONGODB_URI` and `BLOCKCHAIN_RPC_URL` when asked.
5. Open `https://votechain-india-web.onrender.com`. Free services sleep when idle, so the first request after a pause can take about a minute.

On Sepolia, the admin approves voters on-chain from the admin wallet, and each voter needs a little Sepolia ETH to pay for their vote.

## Security

Never commit `.env`, private keys, real biometric data, or real voter/government records. The deployment private key is only for a dedicated Sepolia test wallet and is never sent to the browser. Secrets on Render are entered in the Render dashboard, never stored in the repository.
