/**
 * @type import('hardhat/config').HardhatUserConfig
 */

require("@nomiclabs/hardhat-waffle");
require('@openzeppelin/hardhat-upgrades');


const ROPSTEN_PRIVATE_KEY = "PRIVATE-KEY-HERE";

module.exports = {
  solidity: "0.8.0",
  networks: {
    ropsten: {
      url: `https://api.mycryptoapi.com/eth`,
      accounts: [`${ROPSTEN_PRIVATE_KEY}`]
    }
  }
};
