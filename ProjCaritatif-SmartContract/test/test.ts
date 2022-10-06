import { assert, expect } from 'chai';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ethers, network } from 'hardhat';
import { BigNumber, Contract } from 'ethers';
import {
    defaultAbiCoder,
    keccak256,
    LogDescription,
    parseEther,
} from 'ethers/lib/utils';
import { MerkleTree } from 'merkletreejs';
import { ethAddressList } from '../addressList';

describe('nft contract', function () {
    let precontract: any;
    let contract: Contract;

    let owner: SignerWithAddress;
    let addr1: SignerWithAddress;
    let addr2: SignerWithAddress;
    let addr3: SignerWithAddress;
    let addrs: SignerWithAddress[];

    beforeEach(async function () {
        [owner, addr1, addr2, addr3, ...addrs] = await ethers.getSigners();
        precontract = await ethers.getContractFactory('nft');
        contract = await precontract.deploy();
    });

    // describe('Deployment', function () {
    //     it('Should set the right owner', async function () {
    //         expect(await contract.owner()).to.equal(owner.address);
    //     });
    // });

    describe('Mint', async function () {
        beforeEach(async function () {
            await contract.toggleActive();
        });

        it('Should fail to mint if public sale not opened', async function () {
            await contract.toggleActive();
            await expect(
                contract.connect(addr2).mintNFT(2, 111, {
                    value: 1,
                })
            ).to.be.revertedWith('PublicSale is not active');
        });

        it('Should fail if Ether value sent is not correct', async function () {
            await expect(
                contract.connect(addr2).mintNFT(3, 111, {
                    value: 10,
                })
            ).to.be.revertedWith('incorrect eth value');
        });

        it('Should return correct total supply', async function () {
            await expect(
                await contract.connect(addr2).mintNFT(4, 111, {
                    value: 1,
                })
            );
            await expect(
                await contract.connect(addr2).mintNFT(5, 111, {
                    value: 1,
                })
            );
            await expect(
                await contract.connect(addr3).mintNFT(6, 111, {
                    value: 1,
                })
            );
            await expect(
                await contract.connect(addrs[4]).mintNFT(7, 111, {
                    value: 1,
                })
            );
            await expect(
                await contract.connect(addrs[5]).mintNFT(8, 111, {
                    value: 1,
                })
            );
            await expect(
                await contract.connect(addrs[6]).mintNFT(9, 111, {
                    value: 1,
                })
            );
            await expect(
                await contract.connect(addrs[7]).mintNFT(4, 111, {
                    value: 1,
                })
            );
            await expect(
                await contract.connect(addrs[8]).mintNFT(2, 111, {
                    value: 1,
                })
            );
            await expect(
                await contract.connect(addrs[9]).mintNFT(5, 111, {
                    value: 1,
                })
            );
            await expect(await contract.totalSupply()).to.equal(9);
        });
        it('Should return correct tokenURI', async function () {
            await expect(
                await contract.connect(addr2).mintNFT(9, 111, {
                    value: 1,
                })
            );

            await contract.setURI('uri.com/');

            await expect(await contract.tokenURI(0)).to.equal('uri.com/9');
        });

        it('Should return correct Img Id and message', async function () {
            await expect(
                await contract.connect(addr2).mintNFT(1, 115, {
                    value: 1,
                })
            ).to.not.be.reverted;

            await expect(await contract.nftIdToImgId(0)).to.equal('1');
            await expect(await contract.nftIdToMessage(0)).to.equal('115');

            await expect(
                await contract.connect(addr3).mintNFT(3, 51, {
                    value: 1,
                })
            ).to.not.be.reverted;

            await expect(await contract.nftIdToImgId(1)).to.equal('3');
            await expect(await contract.nftIdToMessage(1)).to.equal('51');
        });

        it('Should return correct supply Image', async function () {
            let i = 0;
            let imageData;
            while (i < 8) {
                await expect(
                    await contract.connect(addr3).mintNFT(3, 51, {
                        value: 1,
                    })
                ).to.not.be.reverted;

                i++;
                imageData = await contract.imageData(3);

                await expect(imageData.totalSupply).to.equal(i);
            }
        });

        it('Should not surpass supply', async function () {
            await expect(
                await contract.connect(addr3).mintNFT(1, 1, {
                    value: 1,
                })
            ).to.not.be.reverted;
            await expect(
                await contract.connect(addr3).mintNFT(1, 2, {
                    value: 1,
                })
            ).to.not.be.reverted;
            await expect(
                await contract.connect(addr3).mintNFT(1, 3, {
                    value: 1,
                })
            ).to.not.be.reverted;
            await expect(
                await contract.connect(addr3).mintNFT(1, 4, {
                    value: 1,
                })
            ).to.not.be.reverted;
            await expect(
                await contract.connect(addr3).mintNFT(1, 5, {
                    value: 1,
                })
            ).to.not.be.reverted;
            await expect(
                await contract.connect(addr3).mintNFT(1, 6, {
                    value: 1,
                })
            ).to.not.be.reverted;
            await expect(
                await contract.connect(addr3).mintNFT(1, 7, {
                    value: 1,
                })
            ).to.not.be.reverted;
            await expect(
                await contract.connect(addr3).mintNFT(1, 8, {
                    value: 1,
                })
            ).to.not.be.reverted;
            await expect(
                await contract.connect(addr3).mintNFT(1, 9, {
                    value: 1,
                })
            ).to.not.be.reverted;
            await expect(
                await contract.connect(addr3).mintNFT(1, 10, {
                    value: 1,
                })
            ).to.not.be.reverted;

            await expect(
                contract.connect(addr3).mintNFT(1, 11, {
                    value: 1,
                })
            ).to.be.revertedWith('max supply reached for this img');
        });

        it('Should withdraw normaly', async function () {
            await expect(
                await contract.connect(addr2).mintNFT(4, 11, {
                    value: 1,
                })
            );

            await expect(await contract.connect(owner).withdraw(addr2.address));
        });

        it('Should not withdraw normaly by no owner', async function () {
            await expect(
                contract.connect(addr1).withdraw(addr2.address)
            ).to.be.revertedWith('Ownable: caller is not the owner');
        });

        it('Should not mint with id image that does not exist', async function () {
            await expect(
                contract.connect(addr2).mintNFT(12, 11, {
                    value: 1,
                })
            ).to.be.revertedWith('invalid _imgId');
        });

        it('Should return correct balance Of', async function () {
            await expect(
                contract.connect(addr2).mintNFT(2, 11, {
                    value: 1,
                })
            );
            await expect(
                await contract.connect(addr2).balanceOf(addr2.address)
            ).to.equal(1);
        });

        it('Should mint unique nft by owner', async function () {
            await expect(
                await contract.connect(owner).mintNFT(0, 11, {
                    value: 0,
                })
            );
        });

        it('Should not mint unique nft by other user', async function () {
            await expect(
                contract.connect(addr1).mintNFT(0, 11, {
                    value: 0,
                })
            ).to.be.revertedWith('invalid _imgId');
        });
    });
});

describe('auction contract', async function () {
    let precontract: any;
    let contract: Contract;
    let precontractAuction: any;
    let contractA: Contract;
    let owner: SignerWithAddress;
    let addr1: SignerWithAddress;
    let addr2: SignerWithAddress;
    let addr3: SignerWithAddress;
    let addrs: SignerWithAddress[];

    beforeEach(async function () {
        [owner, addr1, addr2, addr3, ...addrs] = await ethers.getSigners();
        precontract = await ethers.getContractFactory('nft');
        contract = await precontract.deploy();
        precontractAuction = await ethers.getContractFactory('EnglishAuction');
        contractA = await precontractAuction.deploy(contract.address, 0, 1);
    });

    it('Should start by owner', async function () {
        await expect(await contractA.connect(owner).start(100));
        await expect(contractA.connect(addr2).start(100)).to.be.revertedWith(
            'not seller'
        );
    });

    it('Should not bid by user before start', async function () {
        await expect(
            contractA.connect(addr2).bid({
                value: 2,
            })
        ).to.be.revertedWith('not started');
    });

    describe('auction', async function () {
        beforeEach(async function () {
            await contract.toggleActive();
            await contract.connect(owner).mintNFT(0, 111, {
                value: 0,
            });
            await expect(await contractA.connect(owner).start(100));
        });

        it('Should bid by users', async function () {
            await expect(
                await contractA.connect(addr1).bid({
                    value: 2,
                })
            );
            await expect(
                await contractA.connect(addr2).bid({
                    value: 3,
                })
            );
            await expect(
                await contractA.connect(addr2).highestBidder()
            ).to.equal(addr2.address);
        });

        it('Should not bid by user with inferior value', async function () {
            await expect(
                await contractA.connect(addr2).bid({
                    value: 3,
                })
            );
            await expect(
                contractA.connect(addr2).bid({
                    value: 2,
                })
            ).to.be.revertedWith('value < highest bid');

            await expect(await contractA.connect(addr2).highestBid()).to.equal(
                3
            );
        });

        // it('Should stop auction by owner', async function () {
        //     await expect(await contractA.connect(owner).end());
        //     await expect(contractA.connect(addr2).end()).to.be.revertedWith(
        //         'not seller'
        //     );
        // });
    });
});
