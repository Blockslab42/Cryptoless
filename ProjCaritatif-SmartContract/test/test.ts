import { assert, expect } from 'chai';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ethers, network } from 'hardhat';
import { BigNumber, Contract } from 'ethers';
import { defaultAbiCoder, keccak256, parseEther } from 'ethers/lib/utils';
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

    describe('Public Sale', async function () {
        beforeEach(async function () {
            console.log('addr2', addr2);
            await contract.toggleActive();
        });

        it('Should fail if public sale not opened', async function () {
            await expect(
                contract.connect(addr2).mintNFT(1, 9, 111, {
                    value: 1,
                })
            ).to.be.revertedWith('PublicSale is not active');
        });

        // it('Should fail if buy limit is reached', async function () {
        //     await expect(
        //         contract.connect(addr2).mintNFT(11, {
        //             value: 1,
        //         })
        //     ).to.be.revertedWith('Cannot mint above limit');
        // });

        // it('Should fail if Ether value sent is not correct', async function () {
        //     await expect(
        //         contract.connect(addr2).mintNFT(1, 9, 111, {
        //             value: 1,
        //         })
        //     ).to.be.revertedWith('Ether value sent is not correct');
        // });

        // it('Should mint 2 NFT', async function () {
        //     await expect(
        //         await contract.connect(addr2).mintNFT(1, 9, 111, {
        //             value: 2,
        //         })
        //     );
        //     await expect(await contract.ownerOf(0)).to.equal(addr2.address);
        //     await expect(await contract.ownerOf(1)).to.equal(addr2.address);
        //     await expect(await contract.totalSupply()).to.equal(2);
        // });

        // it('Should withdraw the money', async function () {
        //     await expect(
        //         await contract.connect(addr2).mintNFT(1, 9, 111, {
        //             value: 1,
        //         })
        //     );
        //     await expect(
        //         await contract.connect(addr2).mintNFT(1, 9, 111, {
        //             value: 1,
        //         })
        //     );
        //     await expect(
        //         await contract.connect(addr3).mintNFT(1, 9, 111, {
        //             value: 1,
        //         })
        //     );
        //     await expect(
        //         await contract.connect(addrs[4]).mintNFT(1, 9, 111, {
        //             value: 1,
        //         })
        //     );
        //     await expect(
        //         await contract.connect(addrs[5]).mintNFT(1, 9, 111, {
        //             value: 1,
        //         })
        //     );
        //     await expect(
        //         await contract.connect(addrs[6]).mintNFT(1, 9, 111, {
        //             value: 1,
        //         })
        //     );
        //     await expect(
        //         await contract.connect(addrs[7]).mintNFT(1, 9, 111, {
        //             value: 1,
        //         })
        //     );
        //     await expect(
        //         await contract.connect(addrs[8]).mintNFT(1, 9, 111, {
        //             value: 1,
        //         })
        //     );
        //     await expect(
        //         await contract.connect(addrs[9]).mintNFT(1, 9, 111, {
        //             value: 1,
        //         })
        //     );
        //     await expect(await contract.totalSupply()).to.equal(27);
        // });
    });
});
