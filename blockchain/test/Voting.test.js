import { expect } from 'chai';
import hre from 'hardhat';

const Status = { None: 0n, Created: 1n, Active: 2n, Ended: 3n };

async function deploy() {
  const [admin, voter, other] = await hre.ethers.getSigners();
  const Factory = await hre.ethers.getContractFactory('Voting');
  const contract = await Factory.deploy(admin.address);
  await contract.waitForDeployment();
  return { contract, admin, voter, other };
}

// Deploys, registers `voter`, creates election 1 with one candidate and starts it.
async function activeElection() {
  const ctx = await deploy();
  await ctx.contract.registerVoter(ctx.voter.address);
  await ctx.contract.createElection();
  await ctx.contract.addCandidate(1, 1, 'Alice');
  await ctx.contract.startElection(1);
  return ctx;
}

describe('Voting', function () {
  it('deploys with admin', async () => {
    const { contract, admin } = await deploy();
    expect(await contract.admin()).to.equal(admin.address);
  });

  it('restricts admin functions', async () => {
    const { contract, other } = await deploy();
    await expect(contract.connect(other).registerVoter(other.address)).to.be.revertedWith('Admin only');
    await expect(contract.connect(other).createElection()).to.be.revertedWith('Admin only');
  });

  it('creates sequential election ids and emits ElectionCreated', async () => {
    const { contract } = await deploy();
    await expect(contract.createElection()).to.emit(contract, 'ElectionCreated').withArgs(1n);
    await expect(contract.createElection()).to.emit(contract, 'ElectionCreated').withArgs(2n);
    expect(await contract.electionCount()).to.equal(2n);
    expect(await contract.getElectionStatus(1)).to.equal(Status.Created);
    expect(await contract.getElectionStatus(99)).to.equal(Status.None);
  });

  it('accepts a vote and records it per election', async () => {
    const { contract, voter } = await activeElection();
    await expect(contract.connect(voter).castVote(1, 1))
      .to.emit(contract, 'VoteCast').withArgs(1n, voter.address, 1n);
    expect(await contract.hasVoted(1, voter.address)).to.equal(true);
    const [ids, names, counts, status] = await contract.getResults(1);
    expect(ids).to.deep.equal([1n]);
    expect(names).to.deep.equal(['Alice']);
    expect(counts).to.deep.equal([1n]);
    expect(status).to.equal(Status.Active);
  });

  it('rejects duplicate vote', async () => {
    const { contract, voter } = await activeElection();
    await contract.connect(voter).castVote(1, 1);
    await expect(contract.connect(voter).castVote(1, 1)).to.be.revertedWith('Already voted');
  });

  it('allows the same voter to vote in a different election', async () => {
    const { contract, voter } = await activeElection();
    await contract.connect(voter).castVote(1, 1);
    await contract.createElection();
    await contract.addCandidate(2, 1, 'Bob');
    await contract.startElection(2);
    await expect(contract.connect(voter).castVote(2, 1)).to.emit(contract, 'VoteCast');
  });

  it('rejects unregistered voter and invalid candidate', async () => {
    const { contract, voter, other } = await activeElection();
    await expect(contract.connect(other).castVote(1, 1)).to.be.revertedWith('Voter not registered');
    await expect(contract.connect(voter).castVote(1, 42)).to.be.revertedWith('Invalid candidate');
  });

  it('rejects duplicate voter registration', async () => {
    const { contract, voter } = await deploy();
    await contract.registerVoter(voter.address);
    await expect(contract.registerVoter(voter.address)).to.be.revertedWith('Voter already registered');
  });

  it('enforces the election lifecycle', async () => {
    const { contract, voter } = await deploy();
    await contract.registerVoter(voter.address);
    await expect(contract.addCandidate(1, 1, 'Alice')).to.be.revertedWith('Election not open for setup');
    await contract.createElection();
    await expect(contract.startElection(1)).to.be.revertedWith('No candidates');
    await expect(contract.connect(voter).castVote(1, 1)).to.be.revertedWith('Election is not active');
    await contract.addCandidate(1, 1, 'Alice');
    await expect(contract.addCandidate(1, 1, 'Alice again')).to.be.revertedWith('Candidate exists');
    await contract.startElection(1);
    await expect(contract.addCandidate(1, 2, 'Late')).to.be.revertedWith('Election not open for setup');
    await contract.endElection(1);
    await expect(contract.connect(voter).castVote(1, 1)).to.be.revertedWith('Election is not active');
    await expect(contract.startElection(1)).to.be.revertedWith('Election not open for setup');
    await expect(contract.endElection(1)).to.be.revertedWith('Election is not active');
  });
});
