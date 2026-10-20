# Blockchain-Based AI Voting System

**Secure Remote Voting Prototype for Eligible Overseas Indian Electors**

A student-level educational prototype combining React, Express, MongoDB Atlas, FastAPI/InsightFace, Solidity, Hardhat, MetaMask and Ethereum Sepolia.

> **Educational Prototype Disclaimer:** This application uses synthetic/demo voter records and consent-based test faces. It does not connect to government voter databases, passport systems, or Election Commission of India infrastructure. AI verification is demonstrative and does not prove citizenship, identity, or legal voting eligibility. The blockchain implementation demonstrates integrity, auditability, and duplicate-vote prevention on Ethereum Sepolia. This prototype must not be used for real elections.

## Architecture

React UI (`5173`) talks to Express (`5000`) for application data and to MetaMask for blockchain transactions. Express talks to MongoDB Atlas and the AI service (`8000`). MetaMask submits votes directly to the Voting contract on Sepolia.

## Quick start

See **SETUP.md** for the exact beginner-friendly sequence.

## Services

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`
- AI: `http://localhost:8000`
- Blockchain: Ethereum Sepolia, chain ID `11155111`

## Security

Never commit `.env`, private keys, real biometric data, or real voter/government records. The deployment private key is only for a dedicated Sepolia test wallet and is never sent to the browser.
