import { expect } from 'chai'; import hre from 'hardhat';
describe('Voting', function(){async function setup(){const [admin,voter,other]=await hre.ethers.getSigners();const F=await hre.ethers.getContractFactory('Voting');const c=await F.deploy(admin.address);await c.waitForDeployment();return {c,admin,voter,other};}
it('deploys with admin',async()=>{const {c,admin}=await setup();expect(await c.admin()).to.equal(admin.address);});
it('registers voter and accepts a vote',async()=>{const {c,admin,voter}=await setup();await c.registerVoter(voter.address);await c.addCandidate(1,'Alice');await c.startElection();await expect(c.connect(voter).castVote(1)).to.emit(c,'VoteCast');expect(await c.hasVoted(voter.address)).to.equal(true);});
it('rejects duplicate vote',async()=>{const {c,admin,voter}=await setup();await c.registerVoter(voter.address);await c.addCandidate(1,'Alice');await c.startElection();await c.connect(voter).castVote(1);await expect(c.connect(voter).castVote(1)).to.be.revertedWith('Already voted');});
it('rejects unauthorized voter and invalid candidate',async()=>{const {c,voter}=await setup();await c.addCandidate(1,'Alice');await c.startElection();await expect(c.connect(voter).castVote(1)).to.be.revertedWith('Voter not registered');});
it('rejects vote after election ends',async()=>{const {c,admin,voter}=await setup();await c.registerVoter(voter.address);await c.addCandidate(1,'Alice');await c.startElection();await c.endElection();await expect(c.connect(voter).castVote(1)).to.be.revertedWith('Election is not active');});
});
