const hardhat = require("hardhat");

async function deployContract() {
    await hardhat.run('compile');
    const abstractNFTContract = await hardhat.ethers.getContractFactory("AbstractNFT");
    const abstractNFT = await abstractNFTContract.deploy("Tokenstack", "TS");
    return {
        "address": abstractNFT.address,
        "contract": abstractNFT
    }
}

deployContract().then((output) => {
    console.log(output);
});