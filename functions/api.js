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
    // Required Body Parameters
    const privateKey = req.body.privateKey;
    const publicKey = req.body.publicKey;
    const fileData = req.body.fileData;
    const accessToken = req.body.accessToken;
    const projectId = req.body.projectId;

    if (!privateKey || !publicKey || !fileData || !accessToken || !projectId) {
        res.json({
            success: false,
            error: "Request must include private key, public key, file data, access token, and project id"
        }).status(500);
    }

    // Optional Body Parameters
    const description = req.body.description ? req.body.description : "";
    const attributes = req.body.attributes ? req.body.attributes : [];
    const externalUrl = req.body.externalUrl ? req.body.externalUrl : "";
    const name = req.body.name ? req.body.name : "A Tokenstack NFT";
    const network = req.body.network ? req.body.network : "rinkeby";
    const nftType = req.body.nftType ? req.body.nftType : "erc-721";

    // Initialize Web3 + Setup COntract
    const web3 = await createWeb3(TOKENSTACK_SETTINGS.nodes[network]);
    const contract = require("./artifacts/contracts/AbstractNFT.sol/AbstractNFT.json");
    const nftContract = new web3.eth.Contract(contract.abi, TOKENSTACK_SETTINGS.contracts.nft[network]);

    // Get image deployment data
    const imageIpfsInfo = await uploadToIPFS(accessToken, fileData);
    if (imageIpfsInfo.error) {
        res.status(500).json(imageIpfsInfo)
    }

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
    signPromise.then((signedTx) => {
        web3.eth.sendSignedTransaction(signedTx.rawTransaction, async function (err, hash) {
            if (err) {
                functions.logger.log("Error Encountered: " + err);
                res.status(500).json({
                    success: false,
                    error: err
                });
            } else {
                const update = await updateStats(accessToken, projectId, 1, 1);
                // const transactionSnapshot = await web3.eth.getTransaction(hash);
                // const gasFee = transactionSnapshot.gasPrice / 1000000000;
                const gasFee = await web3.eth.getGasPrice().then((result) => web3.utils.fromWei(result, 'ether'))
                const addNFt = await addNftToProject(accessToken, projectId, image, hash, metadataIpfsInfo.ipfsPath, network, gasFee, publicKey, nftType)
                res.status(200).json({
                    transactionHash: hash,
                    image: image,
                    metadata: metadataIpfsInfo.ipfsPath,
                    success: true
                });
            }
        });
    }).catch((err) => {
        functions.logger.log("Error Encountered: " + err);
        res.status(500).json({
            success: false,
            error: err
        });
    });
});

// Web3js Settings
async function createWeb3(nodeUrl) {
    const web3 = createAlchemyWeb3(nodeUrl);
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

async function updateStats(accessToken, projectId, nftApiAmount, totalApiAmount) {
    const statsData = {
        projectId: projectId,
        nftApiAmount: nftApiAmount,
        totalApiAmount: totalApiAmount,
        apiToken: process.env.API_TOKEN
    }

    const statsResponse = await axios({
        method: 'post',
        url: TOKENSTACK_APP_URL + "stats/update",
        headers: {
            "Authorization": accessToken
        },
        data: statsData
    }).then((response) => response.data);

    return statsResponse;
}

async function addNftToProject(accessToken, projectId, file, transactionHash, metadata, network, gasFee, nftOwner, nftType) {
    const nftData = {
        projectId: projectId,
        file: file,
        transactionHash: transactionHash,
        metadata, metadata,
        network: network,
        gasFee, gasFee,
        nftOwner: nftOwner,
        nftType: nftType,
        apiToken: process.env.API_TOKEN
    }
    const addNftToProjectResponse = await axios({
        method: 'post',
        url: TOKENSTACK_APP_URL + "project/add/nfts",
        headers: {
            "Authorization": accessToken
        },
        data: nftData
    }).then((response) => response.data);

    return addNftToProjectResponse;

}

api.listen(APP_PORT, () => {
    console.log(`api listening at http://localhost:${APP_PORT}`)
})

exports.api = functions.https.onRequest(api);