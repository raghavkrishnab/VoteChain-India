# Blockchain

`Voting.sol` supports multiple elections, each with a lifecycle `Created → Active → Ended`:

- `registerVoter(address)`: the admin authorises a wallet once, for all elections.
- `unregisterVoters(address[])`: the admin removes wallets from the voter list (used when deleting voters). Votes already cast stay counted.
- `createElection()` returns an id and emits `ElectionCreated`. `addCandidate(electionId, candidateId, name)` works only while the election is `Created`.
- `startElection(id)` needs at least one candidate. `endElection(id)` is final, and an ended election can't be restarted.
- `castVote(electionId, candidateId)`: registered wallets only, one vote per wallet per election (`hasVoted(electionId, wallet)`).
- `getResults(electionId)`, `getElectionStatus(electionId)`.

The contract stores only voting state, authorised wallets, candidate names and counts. It stores no passwords, documents, images or biometric data.
