# Blockchain

Voting.sol stores only voting state, authorized wallets, candidates, vote counts and events. It does not store passwords, passport data, images, embeddings or other biometric data. Duplicate voting is enforced by `hasVoted` in the contract.
