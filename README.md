# Blockchain-Based AI Voting System

**Secure Remote Voting Prototype for Eligible Overseas Indian Electors**

A student-level educational prototype combining React, Express, MongoDB Atlas, FastAPI/InsightFace/Tesseract, Solidity, Hardhat, MetaMask and Ethereum Sepolia.

> **Educational Prototype Disclaimer:** This application uses synthetic/demo voter records and consent-based test faces. It does not connect to government voter databases, passport systems, or Election Commission of India infrastructure. AI verification is demonstrative and does not prove citizenship, identity, or legal voting eligibility. The blockchain implementation demonstrates integrity, auditability, and duplicate-vote prevention on Ethereum Sepolia. This prototype must not be used for real elections.

## Architecture

```
React (5173) ──REST──▶ Express (5000) ──▶ MongoDB Atlas
     │                      │ ├──▶ FastAPI AI service (8000): face match + OCR age check
     │                      │ └──▶ Sepolia RPC (read-only: verifies votes, reads results)
     └──MetaMask──▶ Voting.sol on Sepolia (all writes: admin actions and votes)
```

- **The contract is the source of truth** for voter authorisation, election lifecycle, one-vote-per-wallet and vote counts. It supports multiple elections.
- **The backend never trusts the client about the chain.** It checks election status and candidates on-chain before syncing, confirms a vote's transaction receipt before recording it, and reads results directly from the contract.
- **AI verification** compares a live photo with the reference face stored at registration (never a client-supplied reference) and reads the date of birth from the registered document.

## Project layout

| Folder | Contents | Tests |
|---|---|---|
| `blockchain/` | `Voting.sol`, deploy and ABI-sync scripts | `npm test` (Hardhat) |
| `backend/` | Express API, Mongoose models, chain service | `npm test` (node:test) |
| `ai-service/` | FastAPI `/verify`, InsightFace, Tesseract OCR | `pytest` |
| `frontend/` | React + Vite + Tailwind UI | `npm run build` |
| `docs/` | Architecture, API, security notes | |

## Quick start

After the one-time setup in **[SETUP.md](SETUP.md)** (copy the `.env` files and create the AI venv):

```powershell
.\start.ps1                   # local mode: everything on this PC, no test ETH or Atlas needed
.\start.ps1 -Network sepolia  # Sepolia testnet + MongoDB Atlas
```

Then open http://localhost:5173. `GET http://localhost:5000/api/health` reports the database, AI service and blockchain status.

## Security

Never commit `.env`, private keys, real biometric data, or real voter/government records. Uploaded registration files live in `backend/uploads/`, which is gitignored. The deployment private key is only for a dedicated Sepolia test wallet and is never sent to the browser.
