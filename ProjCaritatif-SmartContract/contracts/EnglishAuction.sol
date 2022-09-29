// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "erc721a/contracts/ERC721A.sol";

import "hardhat/console.sol";

contract EnglishAuction{
    event Start();
    event Bid(address indexed sender, uint amount);
    event Withdraw(address indexed bidder, uint amount);
    event End(address highestBidder, uint amount);

    ERC721A public immutable nft;
    uint public immutable nftId;

    address payable public immutable seller;
    uint32 public duration;
    uint32 public endAt;
    bool public started;
    bool public ended;

    address public highestBidder;
    uint public highestBid;
    mapping(address => uint) public bids;

    constructor( address _nft, uint _nftId, uint _startingBid, uint32 _duration){
        nft = ERC721A(_nft);
        nftId = _nftId;
        seller = payable(msg.sender);
        duration = _duration;
        highestBid = _startingBid;
    }

    function startAuction() external{
        require(msg.sender == seller, "not seller");
        require(!started, "started");
        started = true;
        endAt = uint32(block.timestamp + duration);
        //seller
        nft.transferFrom(msg.sender, address(this), nftId);

        emit Start();
    }

    function bid() external payable{
        require(started, "not started");
        require(block.timestamp < endAt, "ended");
        require(msg.value > highestBid, "value < highest bid");
        
        if (highestBidder != address(0))
        {
            bids[highestBidder] += highestBid;
        }
        
        highestBid = msg.value;
        highestBidder = msg.sender;

        emit Bid(msg.sender, msg.value);
    }

    function withdraw() external{
        uint bal = bids[msg.sender];
        bids[msg.sender] = 0;
        payable(msg.sender).transfer(bal);
        emit Withdraw(msg.sender, bal);
    }

    function end() external{
        require(started, "not started");
        require(!ended, "ended");
        require(block.timestamp >= endAt, "not ended");

        ended = true;

        if (highestBidder != address(0))
        {
            nft.transferFrom(address(this), highestBidder, nftId);
            seller.transfer(highestBid);
        }   
        else{
            nft.transferFrom(address(this), seller, nftId);
        }   

        emit End(highestBidder, highestBid);
    }

}