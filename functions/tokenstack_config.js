require('dotenv').config();

TOKENSTACK_APP_URL = "https://us-central1-tokenstack-dev.cloudfunctions.net/app/";
TOKENSTACK_SETTINGS = {
    contracts: {
        nft: {
            rinkeby: "0xFCf455b6a9cBEE05c9393aecb190301EF8CC47f8"
        }
    }
};

module.exports = { TOKENSTACK_APP_URL, TOKENSTACK_SETTINGS };