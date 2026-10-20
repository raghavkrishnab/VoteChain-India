# Security

- bcrypt (cost 12) password hashing; JWT (2h) with a required secret; Helmet; CORS restricted to the frontend origin; rate limits on auth and verification.
- Wallet ownership is proven by signature at registration and on every wallet login (single-use nonce).
- Uploads: MIME allow-list, 5 MB limit, server-chosen filenames; files are deleted if registration fails.
- Admin endpoints accept only whitelisted fields (no mass assignment).
- The backend verifies on-chain state instead of trusting client claims about transactions.
- Duplicate voting and voter authorisation are enforced by the contract.

This is still a student prototype and is not production election infrastructure. Known limits: the liveness check doesn't detect spoofing, and on-chain votes are publicly linkable to wallets.
