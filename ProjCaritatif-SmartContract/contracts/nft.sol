// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "erc721a/contracts/ERC721A.sol";

contract nft is ERC721A, Ownable {
    string public _contractBaseURI;
    uint256 public MAX_NFT_PUBLIC = 100;
    uint256 public nbrMinted = 0;
    uint256 public NFTPrice = 200000000000000000; // 0.2 ETH;
    uint256 public maxPerWalletPresale = 6;
    uint256 public maxPerTransaction = 10;
    bool public isActive;
    bool public isPresaleActive;
    bool public isPublicSaleActive;
    bool public isFreeMintActive;
    bytes32 public root;

    enum RarityName {
        UNIQUE,
        RARE,
        COMMON
    }

    struct RaritySpecs {
        uint256 totalSupply;
        uint256 maxSupply;
        uint256 price;
        uint256 nbrImg;
    }

    mapping(RarityName => RaritySpecs) public rarities;
    mapping(uint256 => RarityName) public nftIdToRarity;
    mapping(uint256 => uint256) public messageStoredInNft;
    mapping(uint256 => uint256) public nftIdToIdImg;

    constructor() ERC721A("nft", "nft") {
        //fill rarities data
    }

    mapping(address => uint256) public whiteListClaimed;
    mapping(address => bool) private giveawayMintClaimed;

    modifier isContractPublicSale() {
        require(isActive == true, "Contract is not active");
        require(isPublicSaleActive == true, "PublicSale is not active");
        require(isPresaleActive == false, "Presale is still active");
        _;
    }
    modifier isContractPresale() {
        require(isActive == true, "Contract is not active");
        require(isPresaleActive == true, "Presale is not opened yet");
        require(isPublicSaleActive == false, "PublicSale is still active");
        _;
    }

    /*
     * Function to mint new NFTs during the public sale
     */
    function mintNFT(uint256 _numOfTokens, RarityName _rarity, uint256 _idImg, uint256 _message)
        external
        payable
        isContractPublicSale
    {
        require(_numOfTokens <= maxPerTransaction, "Cannot mint above limit");
        require(
            totalSupply() + _numOfTokens <= MAX_NFT_PUBLIC,
            "Purchase would exceed max public supply of NFTs"
        );
        require(
            NFTPrice * _numOfTokens <= msg.value,
            "Ether value sent is not correct"
        );

        if (_rarity == RarityName.UNIQUE) {
            revert("call auction contract");
        }

        require(rarities[_rarity].price == msg.value);
        require(
            rarities[_rarity].totalSupply + _numOfTokens <
                rarities[_rarity].maxSupply,
            "max supply reached"
        );
        require(_idImg>= 0 && _idImg>= rarities[_rarity].nbrImg, "");

        _safeMint(msg.sender, _numOfTokens);

        rarities[_rarity].totalSupply++;
        nftIdToRarity[nbrMinted] = _rarity;
        nftIdToIdImg[nbrMinted] = _idImg;
        messageStoredInNft[nbrMinted] = _message;
        nbrMinted++;
    }

    // function mintDNFT(uint256 _numOfTokens, string message) external payable isContractPublicSale {
    //     require(_numOfTokens <= maxPerTransaction, "Cannot mint above limit");
    //     require( totalSupply() + _numOfTokens <= MAX_NFT_PUBLIC , "Purchase would exceed max public supply of NFTs" );
    //     require( NFTPrice * _numOfTokens <= msg.value, "Ether value sent is not correct" );
    //     // messageStoredInNft[] = message;
    //     _safeMint(msg.sender, _numOfTokens);
    // }

    /*
     * Function to mint new NFTs during the public sale
     */

    function mintNFTDuringPresale(uint256 _numOfTokens, bytes32[] memory _proof)
        external
        payable
        isContractPresale
    {
        require(
            MerkleProof.verify(_proof, root, keccak256(abi.encode(msg.sender))),
            "Not whitelisted"
        );
        require(
            totalSupply() < MAX_NFT_PUBLIC,
            "All public tokens have been minted"
        );
        require(
            totalSupply() + _numOfTokens <= MAX_NFT_PUBLIC,
            "Purchase would exceed max public supply of NFTs"
        );

        if (!isFreeMintActive) {
            require(
                whiteListClaimed[msg.sender] + _numOfTokens <=
                    maxPerWalletPresale,
                "Purchase exceeds max whitelisted"
            );
            require(
                totalSupply() + _numOfTokens <= MAX_NFT_PUBLIC,
                "Purchase would exceed max public supply of NFTs"
            );
            require(
                NFTPrice * _numOfTokens <= msg.value,
                "Ether value sent is not correct"
            );
            whiteListClaimed[msg.sender] += _numOfTokens;
            _safeMint(msg.sender, _numOfTokens);
        } else {
            require(_numOfTokens == 1, "Cannot purchase this many tokens");
            require(
                !giveawayMintClaimed[msg.sender],
                "Already claimed giveaway"
            );
            giveawayMintClaimed[msg.sender] = true;
            _safeMint(msg.sender, _numOfTokens);
        }
    }

    /*
     * Function to mint NFTs for giveaway and partnerships
     */
    function mintByOwner(address _to) public onlyOwner {
        require(
            totalSupply() + 1 <= MAX_NFT_PUBLIC,
            "Tokens number to mint cannot exceed number of MAX tokens category 1"
        );
        _safeMint(_to, 1);
    }

    /*
     * Function to mint all NFTs for giveaway and partnerships
     */
    function mintMultipleByOwner(address[] memory _to) public onlyOwner {
        require(
            totalSupply() + _to.length <= MAX_NFT_PUBLIC,
            "Tokens number to mint cannot exceed number of tokens"
        );
        for (uint256 i = 0; i < _to.length; i++) {
            _safeMint(_to[i], 1);
        }
    }

    /*
     * Function to withdraw collected amount during minting by the owner
     */
    function withdraw(address _to) public onlyOwner {
        require(address(this).balance > 0, "Balance should be more than zero");
        uint256 balance = address(this).balance;
        (bool sent1, ) = _to.call{value: balance}("");
        require(sent1, "Failed to send Ether");
    }

    function _baseURI() internal view override returns (string memory) {
        return _contractBaseURI;
    }

    /*
     * Function to set Base URI
     */
    function setURI(string memory _URI) external onlyOwner {
        _contractBaseURI = _URI;
    }

    /*
     * Function to set NFT Price
     */
    function setNFTPrice(uint256 _price) external onlyOwner {
        NFTPrice = _price;
    }

    /*
     * Function to set NFT Supply
     */
    function setTotalSupply(uint256 _totalSupply) external onlyOwner {
        MAX_NFT_PUBLIC = _totalSupply;
    }

    /*
     * Function to set the merkle root
     */
    function setRoot(uint256 _root) external onlyOwner {
        root = bytes32(_root);
    }

    /*
     * Function toggleActive to activate/desactivate the smart contract
     */
    function toggleActive() external onlyOwner {
        isActive = !isActive;
    }

    /*
     * Function togglePublicSale to activate/desactivate public sale
     */
    function togglePublicSale() external onlyOwner {
        isPublicSaleActive = !isPublicSaleActive;
    }

    /*
     * Function togglePresale to activate/desactivate  presale
     */
    function togglePresale() external onlyOwner {
        isPresaleActive = !isPresaleActive;
    }

    /*
    Function to activate/desactivate the free mint
    */
    function toggleFreeMint() external onlyOwner {
        isFreeMintActive = !isFreeMintActive;
    }
}
