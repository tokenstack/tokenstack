require('dotenv').config();

TOKENSTACK_APP_URL = " https://us-central1-tokenstack-dev.cloudfunctions.net/app/";
TOKENSTACK_SETTINGS = {
    contracts: {
        nft: {
            rinkeby: "0xFCf455b6a9cBEE05c9393aecb190301EF8CC47f8",
            ropsten: "0x49Aea9b89dC1528231b6a578204E65963D698255",
            goerli: "0x4C0f96Ede90706ECD1351ABB1499cc5dDdf4510C"
        }
    },
    nodes: {
        rinkeby: process.env.RINKEBY_NODE,
        ropsten: process.env.ROPSTEN_NODE,
        goerli: process.env.GOERLI_NODE,
        mainnet: process.env.MAINNET_NODE,
        polygon: process.env.POLYGON_NODE
    }
};

module.exports = { TOKENSTACK_APP_URL, TOKENSTACK_SETTINGS };