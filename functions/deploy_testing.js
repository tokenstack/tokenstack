const { ethers } = require("hardhat");

async function deployContract() {
    const abstractNFTContract = await ethers.getContractFactory("AbstractNFT");
    const abstractNFT = abstractNFTContract.deploy();
    await abstractNFT.deployed();
    return {
        "address": abstractNFT.address,
        "contractFactory": abstractNFT
    }
}

console.log(deployContract());