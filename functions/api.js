const { TOKENSTACK_APP_URL } = require('./tokenstack_config.js');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const axios = require('axios').default;
const functions = require('firebase-functions');

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
    const fileData = req.body.fileData;
    const ipfsData = await axios({
        method: 'post',
        url: TOKENSTACK_APP_URL + "v1/upload/ipfs",
        headers: {
            "Authorization": req.headers.accessToken
        },
        data: {
            "fileData": fileData,
        }
    }).then((response) => response.data);

    res.json(ipfsData).status(200);
});

api.listen(APP_PORT, () => {
    console.log(`api listening at http://localhost:${APP_PORT}`)
})

exports.api = functions.https.onRequest(api);