# SETUP — First Run

Requirements: Node.js 20+, Python 3.11 or 3.12, MetaMask, a MongoDB Atlas database, an Alchemy (or other) Sepolia RPC URL, and [Tesseract OCR](https://github.com/UB-Mannheim/tesseract/wiki). PDF documents additionally need [Poppler](https://github.com/oschwartz10612/poppler-windows/releases).

## 1. Environment files

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
Copy-Item blockchain/.env.example blockchain/.env
Copy-Item ai-service/.env.example ai-service/.env
```

| File | Values |
|---|---|
| `blockchain/.env` | `SEPOLIA_RPC_URL`, `PRIVATE_KEY` of a **dedicated test wallet** (never a mainnet key, never paste it into chat) |
| `backend/.env` | `MONGODB_URI`, `JWT_SECRET` (random, 32+ chars), `BLOCKCHAIN_RPC_URL` (same RPC URL), `CONTRACT_ADDRESS` (after step 4) |
| `frontend/.env` | `VITE_CONTRACT_ADDRESS` (after step 4) |
| `ai-service/.env` | Optional: `TESSERACT_CMD`, `POPPLER_PATH`, `FACE_MATCH_THRESHOLD` |

## 2. Install dependencies

```powershell
cd blockchain; npm install; cd ..
cd backend;    npm install; cd ..
cd frontend;   npm install; cd ..

cd ai-service
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
cd ..
```

A `venv` copied from another computer does not work (it points at that computer's Python install). Delete it and recreate it as shown above.

## 3. Test the contract

```powershell
cd blockchain
npm test
```

## 4. Deploy to Sepolia and sync the ABI

```powershell
npm run deploy
npm run sync-abi
```

Copy the printed address into `backend/.env` → `CONTRACT_ADDRESS` and `frontend/.env` → `VITE_CONTRACT_ADDRESS`. `sync-abi` copies the compiled ABI into both the frontend and the backend; rerun `npm run compile` and `npm run sync-abi` after every contract change.

**Redeploying?** Elections from an older contract can't be used any more. Clear them (users are kept) with:

```powershell
cd backend
npm run reset:elections -- --yes
```

## 5. Create the admin account

In `backend/.env` set `ADMIN_EMAIL`, `ADMIN_PASSWORD` and `ADMIN_WALLET_ADDRESS` (the wallet that deployed the contract), then:

```powershell
cd backend
npm run seed:admin
```

Remove `ADMIN_PASSWORD` from `.env` afterwards.

## 6. Run the three services (three terminals)

```powershell
cd ai-service; .\venv\Scripts\Activate.ps1; python -m uvicorn main:app --reload --port 8000
cd backend;    npm run dev
cd frontend;   npm run dev
```

Open `http://localhost:5173`. The first verification downloads the InsightFace model (~300 MB).

## 7. Demo flow

1. **Voter:** register with MetaMask connected (you sign a message proving wallet ownership), a demo document showing a date of birth, and a reference face photo.
2. **Voter:** sign in and open **Verify**. Take a live photo with the camera or upload one. The AI service matches it against the registered reference face and reads the age from the document.
3. **Admin** (deployer wallet in MetaMask): open **Admin**, then **Register & approve** for the voter. This registers the wallet on-chain, then marks the voter approved.
4. **Admin:** create an election, add candidates, then **Start election**. Each step is a transaction.
5. **Voter:** open **Vote**, choose a candidate and confirm in MetaMask. The backend checks the transaction receipt before recording the vote.
6. Try to vote again: the contract rejects it with `Already voted`.
7. Check **Results** (read live from the contract) and **Audit** (links to Etherscan).

## Troubleshooting

- **Wrong network:** the app asks MetaMask to switch to Sepolia; approve it.
- **Insufficient ETH:** fund the wallet from a Sepolia faucet.
- **`Admin only` revert:** MetaMask must use the wallet that deployed the contract.
- **"Blockchain RPC or contract address is not configured":** set `BLOCKCHAIN_RPC_URL` and `CONTRACT_ADDRESS` in `backend/.env`.
- **"Could not read voter document":** install Tesseract, or set `TESSERACT_CMD`. For PDFs, set `POPPLER_PATH`.
- **AI service unavailable:** check it is running on port 8000 with the venv activated.
- **MongoDB unavailable:** check Atlas network access and `MONGODB_URI`.
