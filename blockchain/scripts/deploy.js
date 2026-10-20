import hre from 'hardhat';

const { ethers, network } = hre;
const [admin] = await ethers.getSigners();
const Factory = await ethers.getContractFactory('Voting');
const contract = await Factory.deploy(admin.address);
await contract.waitForDeployment();
const { chainId } = await ethers.provider.getNetwork();

console.log(`Contract deployed to: ${await contract.getAddress()}`);
console.log(`Admin wallet: ${admin.address}`);
console.log(`Network: ${network.name} (chain ID ${chainId})`);
