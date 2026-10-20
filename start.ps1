<#
.SYNOPSIS
  Starts the whole voting system, each service in its own window.

.EXAMPLE
  .\start.ps1                   # local mode: private Hardhat blockchain, no test ETH needed
  .\start.ps1 -Network sepolia  # use the contract already deployed to Sepolia (npm run deploy)

  Local mode runs everything on this machine (MongoDB, Hardhat chain, AI, API, UI).
  The chain starts fresh every time, so local elections are cleared on each start;
  local accounts are kept. Atlas and your Sepolia data are never touched.
#>
param([ValidateSet('local', 'sepolia')][string]$Network = 'local')

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$local = $Network -eq 'local'

function Wait-Port([int]$Port, [string]$Name, [int]$Seconds = 90) {
  Write-Host "Waiting for $Name on port $Port..." -NoNewline
  $deadline = (Get-Date).AddSeconds($Seconds)
  while ((Get-Date) -lt $deadline) {
    # Vite listens on IPv6 ::1 on Windows, the other services on IPv4, so try both.
    foreach ($address in '127.0.0.1', '::1') {
      $client = New-Object System.Net.Sockets.TcpClient([System.Net.IPAddress]::Parse($address).AddressFamily)
      try { $client.Connect($address, $Port); Write-Host ' ready'; return } catch { } finally { $client.Dispose() }
    }
    Start-Sleep -Milliseconds 500
  }
  throw "$Name did not start on port $Port"
}

function Start-Window([string]$Title, [string]$Dir, [string]$Command) {
  $script = "`$Host.UI.RawUI.WindowTitle = '$Title'; Set-Location '$root\$Dir'; $Command"
  Start-Process powershell -ArgumentList '-NoExit', '-Command', $script | Out-Null
}

function Invoke-In([string]$Dir, [string]$Command) {
  Push-Location "$root\$Dir"
  try {
    & cmd /c $Command
    if ($LASTEXITCODE -ne 0) { throw "'$Command' failed in $Dir" }
  } finally { Pop-Location }
}

# --- Preflight -------------------------------------------------------------
foreach ($dir in 'backend', 'frontend', 'blockchain') {
  if (-not (Test-Path "$root\$dir\.env")) { throw "$dir\.env is missing. Copy $dir\.env.example to $dir\.env and fill it in (see SETUP.md)." }
  if (-not (Test-Path "$root\$dir\node_modules")) { Write-Host "Installing $dir dependencies..."; Invoke-In $dir 'npm install --no-audit --no-fund' }
}
if (-not (Test-Path "$root\ai-service\venv\Scripts\python.exe")) {
  throw 'ai-service\venv is missing. Create it: cd ai-service; python -m venv venv; .\venv\Scripts\pip install -r requirements.txt'
}
foreach ($port in 27017, 8545, 8000, 5000, 5173) {
  if ($local -or $port -gt 8545) {
    if (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue) { throw "Port $port is already in use. Close the program using it (maybe an earlier run) and try again." }
  }
}

# --- Blockchain ------------------------------------------------------------
if ($local) {
  Start-Window 'Database (MongoDB :27017)' 'backend' 'npm run db:local'
  Start-Window 'Blockchain (Hardhat node :8545)' 'blockchain' 'npm run node'
  Wait-Port 27017 'Local MongoDB' 300
  Wait-Port 8545 'Hardhat node'
  Write-Host 'Deploying contract to the local chain...'
  Invoke-In 'blockchain' 'npm run deploy:local'
  Write-Host 'Preparing the local database (fresh chain = fresh elections)...'
  Invoke-In 'backend' 'npm run reset:elections:local'
  try { Invoke-In 'backend' 'npm run seed:admin:local' }
  catch { Write-Warning 'Admin not seeded: set ADMIN_EMAIL, ADMIN_PASSWORD and ADMIN_WALLET_ADDRESS in backend\.env to log in as admin.' }
}

# --- Services --------------------------------------------------------------
$suffix = if ($local) { ':local' } else { '' }
Start-Window 'AI service (:8000)' 'ai-service' '.\venv\Scripts\python.exe -m uvicorn main:app --port 8000'
Start-Window 'Backend API (:5000)' 'backend' "npm run dev$suffix"
Start-Window 'Frontend (:5173)' 'frontend' "npm run dev$suffix"

Wait-Port 8000 'AI service'
Wait-Port 5000 'Backend API'
Wait-Port 5173 'Frontend'

Write-Host ''
Write-Host "All services are running ($Network mode). Opening http://localhost:5173" -ForegroundColor Green
if ($local) {
  Write-Host 'MetaMask: approve adding the "Hardhat Local" network (chain 31337, http://127.0.0.1:8545) when asked.'
  Write-Host 'Your ADMIN_WALLET_ADDRESS was given 1000 local ETH. Voters get 10 ETH when the admin approves them.'
}
Write-Host 'To stop: close the service windows.'
Start-Process 'http://localhost:5173'
