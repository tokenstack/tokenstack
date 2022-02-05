// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC721/ERC721.sol";

contract AbstractNFT is ERC721 {

    uint256 public tokenCounter;

    constructor(string memory _name, string memory _symbol) 
    public ERC721(_name, _symbol) {
        tokenCounter = 0;
    }

    function createCollectible(string memory tokenURI)
        public return (uint256)
    {
        uint256 newTokenId = tokenCounter;
        _safeMint(msg.sender, newTokenId);
        _setTokenURI(newTokenId, tokenURI);
        tokenCounter = tokenCounter + 1;
        return newTokenId;
    }
}
