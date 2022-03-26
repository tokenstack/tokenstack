/**
 * @type import('hardhat/config').HardhatUserConfig
 */
require('dotenv').config();

require("@nomiclabs/hardhat-waffle");
require('@openzeppelin/hardhat-upgrades');
const crypto = require("crypto");

const PRIVATE_KEY = process.env.PRIVATE_KEY ? process.env.PRIVATE_KEY : crypto.randomBytes(32).toString('hex');

module.exports = {
  solidity: "0.7.3",
  networks: {
    rinkeby: {
      url: process.env.RINKEBY_NODE,
      accounts: [`${PRIVATE_KEY}`],
    },
    ropsten: {
      url: process.env.ROPSTEN_NODE,
      accounts: [`${PRIVATE_KEY}`],
    },
    goerli: {
      url: process.env.GOERLI_NODE,
      accounts: [`${PRIVATE_KEY}`],
    },
    mumbai: {
      url: process.env.MUMBAI_NODE,
      accounts: [`${PRIVATE_KEY}`]
    }
  }
};
