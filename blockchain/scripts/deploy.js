import hre from 'hardhat';
const { ethers } = hre;
const admin = (await ethers.getSigners())[0];
const Factory = await ethers.getContractFactory('Voting');
const contract = await Factory.deploy(admin.address);
await contract.waitForDeployment();
console.log(`Contract deployed to: ${await contract.getAddress()}`);
console.log(`Network: Sepolia`);
console.log(`Chain ID: 11155111`);
