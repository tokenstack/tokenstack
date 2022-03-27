require('dotenv').config();

TOKENSTACK_APP_URL = "https://us-central1-tokenstack-dev.cloudfunctions.net/app/";
TOKENSTACK_SETTINGS = {
    contracts: {
        nft: {
            rinkeby: "0xa0e3eB5f51E05b9575B4752a3510dE63997E82Df",
            ropsten: "0x421726E85520DD10504Cdd383C4E97f5407Bd6C6",
            goerli: "0x421726E85520DD10504Cdd383C4E97f5407Bd6C6",
            mumbai: "0x3f8F5a2469243497199f94204FdD00FD8eF439b3"
        }
    },
    nodes: {
        rinkeby: process.env.RINKEBY_NODE,
        ropsten: process.env.ROPSTEN_NODE,
        goerli: process.env.GOERLI_NODE,
        mainnet: process.env.MAINNET_NODE,
        mumbai: process.env.MUMBAI_NODE
    },
    networks: ["rinkeby", "ropsten", "goerli", "mumbai"],
    nftTypes: ["erc-721"]
};

module.exports = { TOKENSTACK_APP_URL, TOKENSTACK_SETTINGS };