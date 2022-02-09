const { TOKENSTACK_APP_URL, TOKENSTACK_SETTINGS } = require('./tokenstack_config.js');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const axios = require('axios').default;
const functions = require('firebase-functions');
const { ethers } = require("hardhat");

const api = express();
const APP_PORT = 5000;

// ExpressJS Settings
api.use(express.json());
api.use(helmet());
api.use(cors({ origin: true }));
api.use(morgan('combined'));

api.post('/authenticate', async (req, res) => {
    const apiKey = req.body.apiKey;

    const accessToken = await axios({
        method: 'post',
        url: TOKENSTACK_APP_URL + "authenticate",
        data: {
            apiKey: apiKey,
        }
    }).then((response) => response.data);

    res.json(accessToken).status(200);
});

api.post('/v1/upload/ipfs', async (req, res) => {
    const ipfsData = uploadToIPFS(req.body.accessToken, req.body.fileData);

    res.json(ipfsData).status(200);
});

api.post('/v1/nft/mint', async (req, res) => {
    // NFT Metadata + Image Setup
    process.env.PRIVATE_KEY = req.body.privateKey;
    const fileData = req.body.fileData;
    const accessToken = req.body.accessToken;
    const description = req.body.description;
    const attributes = req.body.attributes;
    const externalUrl = req.body.externalUrl;
    const name = req.body.name;

    // Specify Contract
    const abstractNFTContract = await ethers.getContractFactory("AbstractNFT");
    // Specify contract based on Network
    const contractFactory = await abstractNFTContract.attach(
        TOKENSTACK_SETTINGS.contracts.nft.rinkeby // Use contract deployed on Rinkeby
    );

    // Get image deployment data
    const imageIpfsInfo = uploadToIPFS(accessToken, fileData);
    // Get image path from IPFS
    const image = imageIpfsInfo.full_path;
    // Create the metadata
    const metadata = JSON.stringify(createMetadata(description, image, name, attributes, externalUrl));
    // Upload Metadata to the IPFS
    const metadataIpfsInfo = uploadToIPFS(accessToken, metadata);
    // Mint the NFT
    const transaction = await contractFactory.createCollectible(metadataIpfsInfo.full_path);
    const transactionWait = await transaction.wait();

    // Post Mint Checks
    const event = transactionWait.events[0];
    const value = event.args[2];
    const tokenId = value.toNumber();

    const tokenURI = await deploymentResults.contractFactory.tokenURI(tokenId);

    res.status(200).json({
        "tokenId": tokenId,
        "tokenURI": tokenURI
    })

})

function createMetadata(description, image, name, attributes, externalUrl) {
    let metadata = {
        "description": description,
        "image": image,
        "name": name,
    };
    if (attributes != null) {
        metadata["attributes"] = attributes;
    }

    if (external_url != null) {
        metadata["external_url"] = externalUrl;
    }

    return metadata
}
async function deployContract() {
    const abstractNFTContract = await ethers.getContractFactory("AbstractNFT");
    const abstractNFT = abstractNFTContract.deploy();
    await abstractNFT.deployed();
    return {
        "address": abstractNFT.address,
        "contractFactory": abstractNFT
    }
}

async function uploadToIPFS(accessToken, fileData) {
    const ipfsData = await axios({
        method: 'post',
        url: TOKENSTACK_APP_URL + "v1/upload/ipfs",
        headers: {
            "Authorization": accessToken
        },
        data: {
            "fileData": fileData,
        }
    }).then((response) => response.data);

    return ipfsData;
}

api.listen(APP_PORT, () => {
    console.log(`api listening at http://localhost:${APP_PORT}`)
})

exports.api = functions.https.onRequest(api);