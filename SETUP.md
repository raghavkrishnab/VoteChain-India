# SETUP — Beginner-Friendly First Run

## 1. Extract and open

Extract `blockchain-ai-voting-system.zip`, then open the extracted `blockchain-ai-voting-system` folder in VS Code.

## 2. MongoDB Atlas

Create/use a MongoDB Atlas database. Copy the application connection string and place it in `backend/.env` as `MONGODB_URI`.

## 3. Alchemy Sepolia

In Alchemy, create/use an Ethereum Sepolia app and copy its HTTPS RPC URL. Put it in `blockchain/.env` as `SEPOLIA_RPC_URL` and `backend/.env` as `BLOCKCHAIN_RPC_URL`.

## 4. Dedicated Sepolia deployment wallet

Use a separate test wallet. Export its private key from MetaMask only for local Hardhat deployment and put it in `blockchain/.env` as `PRIVATE_KEY`. **Never use a mainnet key and never paste a key into chat.**

## 5. Copy environment examples

PowerShell:

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
Copy-Item blockchain/.env.example blockchain/.env
Copy-Item ai-service/.env.example ai-service/.env
```

Generate a strong JWT secret locally and place it in `backend/.env` as `JWT_SECRET`.

## 6. Install Node dependencies

```powershell
cd blockchain
npm install
cd ../backend
npm install
cd ../frontend
npm install
cd ..
```

Do not install the Python packages again; the existing `ai-service/venv` is intentionally reused.

## 7. Hardhat tests

```powershell
cd blockchain
npx hardhat test
```

## 8. Create the demo admin

Add these temporary variables to `backend/.env` for the one-time admin seed: `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_WALLET_ADDRESS` (the same wallet that deploys the contract). Then run:

```powershell
cd backend
npm run seed:admin
```

Remove `ADMIN_PASSWORD` afterward if you do not need it again.

## 9. Deploy to Sepolia

```powershell
npx hardhat run scripts/deploy.js --network sepolia
```

Copy the printed contract address into:

- `blockchain/.env` → `CONTRACT_ADDRESS`
- `frontend/.env` → `VITE_CONTRACT_ADDRESS`
- `backend/.env` → `CONTRACT_ADDRESS`

Then sync the actual compiled ABI:

```powershell
npm run sync-abi
```

This copies the ABI produced by Hardhat into the frontend. The checked-in frontend ABI is only a bootstrap copy; after every contract change, run `npm run compile` and `npm run sync-abi`.

## 10. Start AI service

Use the existing Python 3.12 environment:

```powershell
cd ..\ai-service
.\venv\Scripts\Activate.ps1
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Do not recreate or delete `venv`. InsightFace may download its model pack on its first real verification run; this is normal.

## 11. Start backend

Open a second terminal:

```powershell
cd backend
npm run dev
```

Expected: `Server running on http://localhost:5000` and `MongoDB connected`.

## 12. Start frontend

Open a third terminal:

```powershell
cd frontend
npm run dev
```

Open `http://localhost:5173`.

## 13. MetaMask

Switch MetaMask to **Ethereum Sepolia**. Never enter a private key into the application. The browser only requests wallet connection, message signatures, and contract transactions.

## 14. Demo flow

1. Register a synthetic demo voter.
2. Connect MetaMask.
3. Complete the nonce/signature login.
4. Perform AI verification with two consented demo images of the same person: a reference image and a current image.
5. From the admin wallet, register the voter's wallet on-chain and approve the demo voter.
6. Create an election and candidates from the admin dashboard.
7. Start the election.
8. Vote from the voter wallet.
9. Wait for the transaction receipt before treating the vote as successful.
10. Attempt a second vote from the same wallet. The smart contract must reject it.
11. Open Results and Audit.

## Troubleshooting

- **Wrong network:** switch MetaMask to Sepolia.
- **Insufficient ETH:** fund the dedicated Sepolia wallet using a faucet.
- **AI unavailable:** confirm port `8000` and that the existing Python 3.12 venv is activated.
- **MongoDB unavailable:** check Atlas network access and `MONGODB_URI`.
- **Contract not configured:** confirm `VITE_CONTRACT_ADDRESS` and rerun `npm run sync-abi`.
- **Admin actions rejected:** connect the same wallet used to deploy the contract, because the deployer is the contract admin.
