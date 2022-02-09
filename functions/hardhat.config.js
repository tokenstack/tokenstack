/**
 * @type import('hardhat/config').HardhatUserConfig
 */

require("@nomiclabs/hardhat-waffle");
require('@openzeppelin/hardhat-upgrades');


const PRIVATE_KEY = "";
const NODE_URL = "";

module.exports = {
  solidity: "0.8.0",
  networks: {
    rinkeby: {
      url: NODE_URL,
      accounts: [`${PRIVATE_KEY}`]
    }
  }
};
