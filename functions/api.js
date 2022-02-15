require('dotenv').config();

const { TOKENSTACK_APP_URL, TOKENSTACK_SETTINGS } = require('./tokenstack_config.js');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const axios = require('axios').default;
const functions = require('firebase-functions');
const { createAlchemyWeb3 } = require("@alch/alchemy-web3");
const api = express();
const APP_PORT = 5000;

// ExpressJS Settings
api.use(express.json({ limit: '50mb' }));
api.use(helmet());
api.use(cors({ origin: true }));
api.use(morgan('combined'));

api.get('/', (req, res) => {
    res.json({
        "Hello": "World",
        "Version": "1.0.0",
    })
});

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

    res.json(ipfsData).status(ipfsData.status);
});

api.post('/v1/nft/mint', async (req, res) => {
    const web3 = await createWeb3();
    const contract = require("./artifacts/contracts/AbstractNFT.sol/AbstractNFT.json");
    const nftContract = new web3.eth.Contract(contract.abi, TOKENSTACK_SETTINGS.contracts.nft.rinkeby);
    // NFT Metadata + Image Setup
    const privateKey = req.body.privateKey;
    const publicKey = req.body.publicKey;
    const fileData = req.body.fileData;
    const accessToken = req.body.accessToken;
    const description = req.body.description;
    const attributes = req.body.attributes;
    const externalUrl = req.body.externalUrl;
    const name = req.body.name;
    functions.logger.log("Data Obtained from API Request");
    // Get image deployment data
    const imageIpfsInfo = await uploadToIPFS(accessToken, fileData);
    if (imageIpfsInfo.error) {
        res.status(500).json(imageIpfsInfo)
    }
    functions.logger.log("Image Uploaded to IPFS");
    // Get image path from IPFS
    const image = imageIpfsInfo.ipfsPath;
    // Create the metadata
    const metadata = JSON.stringify(createMetadata(description, image, name, attributes, externalUrl));
    const metadatab64 = Buffer.from(metadata).toString("base64");
    functions.logger.log("Metadata Created");
    // Upload Metadata to the IPFS
    const metadataIpfsInfo = await uploadToIPFS(accessToken, metadatab64);
    functions.logger.log("Metadata Uploaded");

    // Mint the NFT
    const nonce = await web3.eth.getTransactionCount(publicKey, 'latest'); //get latest nonce
    //the transaction
    const transaction = {
        'from': publicKey,
        'to': TOKENSTACK_SETTINGS.contracts.nft.rinkeby,
        'nonce': nonce,
        'gas': 500000,
        'maxPriorityFeePerGas': 1999999987,
        'data': nftContract.methods.createCollectible(metadataIpfsInfo.ipfsPath).encodeABI()
    };

    const signPromise = web3.eth.accounts.signTransaction(transaction, privateKey);
    functions.logger.log("Transactions Signed");

    signPromise.then((signedTx) => {
        web3.eth.sendSignedTransaction(signedTx.rawTransaction, function (err, hash) {
            if (!err) {
                res.status(200).json({
                    "transactionHash": hash,
                    "image": image,
                    "metadata": metadataIpfsInfo.ipfsPath
                })
            } else {
                functions.logger.log("Error Encountered: " + err);
                res.status(500).json({
                    success: false,
                    error: err
                });
            }
        });
    }).catch((err) => {
        res.status(500).json({
            success: false,
            error: err
        });
    });
});

// Web3js Settings
async function createWeb3() {
    const NODE_URL = await getAppVariable("NODE_URL");
    const web3 = createAlchemyWeb3(NODE_URL);
    return web3;
}

async function getAppVariable(variableName) {
    const variable = await axios({
        method: 'post',
        url: TOKENSTACK_APP_URL + 'internal/getVariable/',
        data: {
            variable: variableName,
            apiToken: process.env.API_TOKEN,
        }
    }).then((response) => response.data);

    return variable.result;
}

function createMetadata(description, image, name, attributes, externalUrl) {
    let metadata = {
        "description": description,
        "image": image,
        "name": name,
    };
    if (attributes != null) {
        metadata["attributes"] = attributes;
    }

    if (externalUrl != null) {
        metadata["external_url"] = externalUrl;
    }
    return metadata;
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