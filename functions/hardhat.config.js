/**
 * @type import('hardhat/config').HardhatUserConfig
 */
require('dotenv').config();

require("@nomiclabs/hardhat-waffle");
require('@openzeppelin/hardhat-upgrades');
const crypto = require("crypto");

const PRIVATE_KEY = process.env.PRIVATE_KEY ? process.env.PRIVATE_KEY : crypto.randomBytes(32).toString('hex');
const NODE_URL = process.env.NODE_URL ? process.env.NODE_URL : crypto.randomBytes(32).toString('hex');

module.exports = {
  solidity: "0.8.1",
  networks: {
    rinkeby: {
      url: NODE_URL,
      accounts: [`${PRIVATE_KEY}`],
    }
  }
};
