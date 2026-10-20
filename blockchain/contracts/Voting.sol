// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title Multi-election voting contract (educational prototype)
/// @notice The admin authorises voter wallets once; each election then has its
///         own candidates, lifecycle and one-vote-per-wallet guarantee.
contract Voting {
    enum Status { None, Created, Active, Ended }

    struct Candidate { string name; uint256 voteCount; bool exists; }

    struct Election {
        Status status;
        uint256[] candidateIds;
        mapping(uint256 => Candidate) candidates;
        mapping(address => bool) hasVoted;
    }

    address public immutable admin;
    uint256 public electionCount;

    mapping(address => bool) public registeredVoter;
    mapping(uint256 => Election) private elections;

    event VoterRegistered(address indexed voter);
    event VoterUnregistered(address indexed voter);
    event ElectionCreated(uint256 indexed electionId);
    event CandidateAdded(uint256 indexed electionId, uint256 indexed candidateId, string name);
    event ElectionStarted(uint256 indexed electionId);
    event ElectionEnded(uint256 indexed electionId);
    event VoteCast(uint256 indexed electionId, address indexed voter, uint256 indexed candidateId);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Admin only");
        _;
    }

    modifier inStatus(uint256 electionId, Status expected) {
        if (elections[electionId].status != expected) revert(_statusError(expected));
        _;
    }

    constructor(address initialAdmin) {
        require(initialAdmin != address(0), "Invalid admin");
        admin = initialAdmin;
    }

    function registerVoter(address voter) external onlyAdmin {
        require(voter != address(0), "Invalid voter");
        require(!registeredVoter[voter], "Voter already registered");
        registeredVoter[voter] = true;
        emit VoterRegistered(voter);
    }

    /// @notice Removes wallets from the voter list (e.g. when a voter account is deleted).
    ///         Votes already cast stay counted; wallets not on the list are skipped.
    function unregisterVoters(address[] calldata voters) external onlyAdmin {
        for (uint256 i = 0; i < voters.length; i++) {
            if (registeredVoter[voters[i]]) {
                registeredVoter[voters[i]] = false;
                emit VoterUnregistered(voters[i]);
            }
        }
    }

    function createElection() external onlyAdmin returns (uint256 electionId) {
        electionId = ++electionCount;
        elections[electionId].status = Status.Created;
        emit ElectionCreated(electionId);
    }

    function addCandidate(uint256 electionId, uint256 candidateId, string calldata name)
        external
        onlyAdmin
        inStatus(electionId, Status.Created)
    {
        Election storage e = elections[electionId];
        require(candidateId > 0, "Invalid candidate ID");
        require(!e.candidates[candidateId].exists, "Candidate exists");
        require(bytes(name).length > 0, "Candidate name required");
        e.candidates[candidateId] = Candidate(name, 0, true);
        e.candidateIds.push(candidateId);
        emit CandidateAdded(electionId, candidateId, name);
    }

    function startElection(uint256 electionId) external onlyAdmin inStatus(electionId, Status.Created) {
        require(elections[electionId].candidateIds.length > 0, "No candidates");
        elections[electionId].status = Status.Active;
        emit ElectionStarted(electionId);
    }

    function endElection(uint256 electionId) external onlyAdmin inStatus(electionId, Status.Active) {
        elections[electionId].status = Status.Ended;
        emit ElectionEnded(electionId);
    }

    function castVote(uint256 electionId, uint256 candidateId) external inStatus(electionId, Status.Active) {
        Election storage e = elections[electionId];
        require(registeredVoter[msg.sender], "Voter not registered");
        require(!e.hasVoted[msg.sender], "Already voted");
        require(e.candidates[candidateId].exists, "Invalid candidate");
        e.hasVoted[msg.sender] = true;
        e.candidates[candidateId].voteCount += 1;
        emit VoteCast(electionId, msg.sender, candidateId);
    }

    function hasVoted(uint256 electionId, address voter) external view returns (bool) {
        return elections[electionId].hasVoted[voter];
    }

    function getElectionStatus(uint256 electionId) external view returns (Status) {
        return elections[electionId].status;
    }

    function getResults(uint256 electionId)
        external
        view
        returns (uint256[] memory ids, string[] memory names, uint256[] memory counts, Status status)
    {
        Election storage e = elections[electionId];
        uint256 n = e.candidateIds.length;
        ids = new uint256[](n);
        names = new string[](n);
        counts = new uint256[](n);
        for (uint256 i = 0; i < n; i++) {
            uint256 id = e.candidateIds[i];
            ids[i] = id;
            names[i] = e.candidates[id].name;
            counts[i] = e.candidates[id].voteCount;
        }
        status = e.status;
    }

    function _statusError(Status expected) private pure returns (string memory) {
        if (expected == Status.Created) return "Election not open for setup";
        if (expected == Status.Active) return "Election is not active";
        return "Invalid election status";
    }
}
