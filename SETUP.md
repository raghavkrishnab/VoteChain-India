# SETUP — How to run it

There are two modes:

| | **Local mode** (recommended to start) | **Sepolia mode** |
|---|---|---|
| Blockchain | Private Hardhat chain on your PC (chain 31337) | Ethereum Sepolia testnet |
| Database | Local MongoDB on your PC (`backend/.localdb`) | MongoDB Atlas |
| Test ETH | Automatic | From a Sepolia faucet |
| Data | Elections reset on every start; accounts kept | Permanent |

## One-time setup

You need Node.js 20+, Python 3.11 or 3.12, Chrome with MetaMask, and [Tesseract OCR](https://github.com/UB-Mannheim/tesseract/wiki) (installed at `C:\Program Files\Tesseract-OCR`, or set `TESSERACT_CMD`).

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
Copy-Item blockchain/.env.example blockchain/.env
```

In `backend/.env`, set at least:

- `JWT_SECRET`: any random string of 32+ characters.
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`: the admin login for the web app.
- `ADMIN_WALLET_ADDRESS`: **your MetaMask account address**. It becomes the contract admin.
- `MONGODB_URI`: your Atlas connection string (only used in Sepolia mode).

Create the AI service's Python environment:

```powershell
cd ai-service
python -m venv venv
.\venv\Scripts\pip install -r requirements.txt
cd ..
```

Node packages install automatically on the first start.

## Start (local mode)

```powershell
.\start.ps1
```

If PowerShell blocks scripts, run `powershell -ExecutionPolicy Bypass -File .\start.ps1`.

The script opens a window per service, deploys the contract, and opens http://localhost:5173:

| Window | Port |
|---|---|
| Database (MongoDB) | 27017 |
| Blockchain (Hardhat node) | 8545 |
| AI service | 8000 |
| Backend API | 5000 |
| Frontend | 5173 |

To stop, close the windows. The **first** start downloads MongoDB (~100 MB) and the face model (~300 MB). Until the model is ready, the app shows a yellow banner.

### MetaMask in local mode

1. When the app asks, approve adding the **Hardhat Local** network (chain 31337, `http://127.0.0.1:8545`).
2. Your admin wallet (`ADMIN_WALLET_ADDRESS`) receives 1000 local ETH on every start. Voters get 10 local ETH automatically when the admin approves them.
3. Each start creates a fresh chain. If MetaMask shows *"nonce too high"*, go to MetaMask → Settings → Advanced → **Clear activity tab data**.

## Start (Sepolia mode)

1. Put `SEPOLIA_RPC_URL` and `PRIVATE_KEY` (a **dedicated test wallet**, never a real one) in `blockchain/.env`.
2. Make sure your current IP is allowed in Atlas → **Network Access**. If it isn't, connections fail with *"SSL alert number 80"*.
3. Deploy once, which writes the address and RPC settings into `backend/.env` and `frontend/.env`. Then clear elections from an older contract and create the admin account:

```powershell
cd blockchain;  npm run deploy; cd ..
cd backend;     npm run reset:elections -- --yes; npm run seed:admin; cd ..
.\start.ps1 -Network sepolia
```

## Demo flow

1. **Register** (voter, using a MetaMask account other than the admin's): fill in the form, click **Connect** and sign the message. Upload a demo document that shows a date of birth (for example `Date of Birth: 15 AUG 1995`) and a clear face photo.
2. **Verify** (voter): take a live photo with the camera or upload one. The AI compares it with the registered face and reads the age from the document.
3. **Admin** (sign in with `ADMIN_EMAIL`/`ADMIN_PASSWORD`, admin wallet selected in MetaMask): click **Register & approve** for the voter.
4. **Admin:** create an election, add candidates, then **Start election**. Each step is a MetaMask transaction.
5. **Vote** (voter): pick a candidate and confirm in MetaMask.
6. Voting again is rejected by the contract (`Already voted`). **Results** update live; **Audit** lists every verified vote.

## Troubleshooting

- **Yellow banner at the top:** it names the service that's down. Check that service's window.
- **"Port … is already in use":** close windows left over from a previous run.
- **"Could not read voter document":** check Tesseract is installed, or set `TESSERACT_CMD` in `ai-service/.env`. PDFs also need Poppler (`POPPLER_PATH`).
- **No date of birth found:** the date must be readable and real, in a format like `15/08/1995`, `15 AUG 1995` or `August 15, 1995`. Use `cd ai-service; .\venv\Scripts\python ocr_check.py <file>` to see what OCR reads.
- **`Admin only` revert:** MetaMask must be on the `ADMIN_WALLET_ADDRESS` account.
