const axios = require('axios').default;
const { TOKENSTACK_APP_URL } = require('./tokenstack_config.js');

const apiHostedUrl = "https://us-central1-tokenstack-dev.cloudfunctions.net/api/";
const appHostedUrl = "https://us-central1-tokenstack-dev.cloudfunctions.net/app/";
const apiLocalUrl = "http://localhost:3000/";
const appLocalUrl = "http://localhost:4000/";

const sampleApiKey = "187d9041-7380-443f-9384-37deb2c34914";

async function testAuthorization() {

    const accessToken = await axios({
        method: 'post',
        url: appHostedUrl + "authenticate",
        data: {
            apiKey: sampleApiKey,
        }
    }).then((response) => response.data);

    console.log(accessToken);
}

async function runAllTests() {
    await testAuthorization();
}

runAllTests();
