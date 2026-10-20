// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Voting is ReentrancyGuard {
    address public immutable admin;
    bool public electionActive;

    struct Candidate { string name; uint256 voteCount; bool exists; }
    mapping(address => bool) public registeredVoter;
    mapping(address => bool) public hasVoted;
    mapping(uint256 => Candidate) private candidates;
    uint256[] private candidateIds;

    event VoterRegistered(address indexed voter);
    event CandidateAdded(uint256 indexed candidateId, string name);
    event ElectionStarted();
    event VoteCast(address indexed voter, uint256 indexed candidateId);
    event ElectionEnded();

    modifier onlyAdmin() { require(msg.sender == admin, "Admin only"); _; }
    modifier active() { require(electionActive, "Election is not active"); _; }

    constructor(address initialAdmin) { require(initialAdmin != address(0), "Invalid admin"); admin = initialAdmin; }

    function registerVoter(address voter) external onlyAdmin {
        require(voter != address(0), "Invalid voter");
        registeredVoter[voter] = true;
        emit VoterRegistered(voter);
    }

    function addCandidate(uint256 candidateId, string calldata name) external onlyAdmin {
        require(candidateId > 0, "Invalid candidate ID");
        require(!candidates[candidateId].exists, "Candidate exists");
        require(bytes(name).length > 0, "Candidate name required");
        candidates[candidateId] = Candidate(name, 0, true);
        candidateIds.push(candidateId);
        emit CandidateAdded(candidateId, name);
    }

    function startElection() external onlyAdmin {
        require(!electionActive, "Already active");
        require(candidateIds.length > 0, "No candidates");
        electionActive = true;
        emit ElectionStarted();
    }

    function castVote(uint256 candidateId) external active nonReentrant {
        require(registeredVoter[msg.sender], "Voter not registered");
        require(!hasVoted[msg.sender], "Already voted");
        require(candidates[candidateId].exists, "Invalid candidate");
        hasVoted[msg.sender] = true;
        candidates[candidateId].voteCount += 1;
        emit VoteCast(msg.sender, candidateId);
    }

    function endElection() external onlyAdmin {
        require(electionActive, "Election not active");
        electionActive = false;
        emit ElectionEnded();
    }

    function getResults() external view returns (uint256[] memory ids, string[] memory names, uint256[] memory counts, bool activeState) {
        ids = new uint256[](candidateIds.length); names = new string[](candidateIds.length); counts = new uint256[](candidateIds.length);
        for (uint256 i=0; i<candidateIds.length; i++) { uint256 id=candidateIds[i]; ids[i]=id; names[i]=candidates[id].name; counts[i]=candidates[id].voteCount; }
        activeState = electionActive;
    }
}
