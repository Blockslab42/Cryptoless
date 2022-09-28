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

    describe('Deployment', function () {
        it('Should set the right owner', async function () {
            expect(await contract.owner()).to.equal(owner.address);
        });
    });

    describe('Giveaways', function () {
        it('Should mint 10 giveaways', async function () {
            await contract.mintMultipleByOwner(ethAddressList);
            expect(await (await contract.totalSupply()).toString()).to.equal(
                '10'
            );
        });

        it('Should be the right owner', async function () {
            await contract.mintMultipleByOwner(ethAddressList);
            expect(await contract.ownerOf(0)).to.equal(ethAddressList[0]);
            expect(await contract.ownerOf(4)).to.equal(ethAddressList[4]);
            expect(await contract.ownerOf(9)).to.equal(ethAddressList[9]);
        });
    });

    describe('Raffle Sale', async function () {
        beforeEach(async function () {
            await contract.toggleActive();
        });

        it('Should fail if Raffle is not active', async function () {
            if (!(await contract.isActive())) await contract.toggleActive();
            await expect(
                contract.connect(addr1).mintNFTDuringRaffle(1, {
                    value: await ((await contract.NFTPrice()) * 2).toString(),
                })
            ).to.be.revertedWith('Raffle is not active');
        });

        it('Should fail if caller not subscribed for raffle', async function () {
            if (!(await contract.isActive())) await contract.toggleActive();

            if (!(await contract.isRaffleActive()))
                await contract.toggleRaffle();

            await expect(
                contract.connect(addr1).mintNFTDuringRaffle(1, {
                    value: await ((await contract.NFTPrice()) * 2).toString(),
                })
            ).to.be.revertedWith('Caller not subscribed to raffle');
        });

        it('Should fail to subscribe if subscription not open', async function () {
            if (!(await contract.isActive())) await contract.toggleActive();

            await expect(
                contract.connect(addr1).subscribeToRaffle({
                    value: await ((await contract.NFTPrice()) * 2).toString(),
                })
            ).to.be.revertedWith('Raffle subscription not open');
        });

        it('Should fail to subscribe if eth value not amount to subscription fee', async function () {
            if (!(await contract.isActive())) await contract.toggleActive();

            if (!(await contract.isSubscriptionOpen()))
                await contract.toggleSubscription();

            await expect(
                contract.connect(addr1).subscribeToRaffle({
                    value: await (
                        (await contract.subscriptionFee()) * 0.5
                    ).toString(),
                })
            ).to.be.revertedWith('Eth value should amount to subscription fee');
        });

        it('Should subscribe to raffle', async function () {
            if (!(await contract.isActive())) await contract.toggleActive();

            if (!(await contract.isSubscriptionOpen()))
                await contract.toggleSubscription();

            await contract.connect(addr1).subscribeToRaffle({
                value: (await contract.subscriptionFee()).toString(),
            });

            expect(await contract.subscribedToRaffle(addr1.address)).to.equal(
                true
            );
        });

        it("Shouldn't mint during raffle if raffle not active", async function () {
            if (!(await contract.isActive())) await contract.toggleActive();
            if (await contract.isRaffleActive()) await contract.toggleRaffle();

            if (!(await contract.isSubscriptionOpen()))
                await contract.toggleSubscription();

            await contract.connect(addr2).subscribeToRaffle({
                value: (await contract.subscriptionFee()).toString(),
            });

            console.log(await contract.isRaffleActive());

            await expect(
                contract.connect(addr2).mintNFTDuringRaffle(1)
            ).to.be.revertedWith('Raffle is not active');
        });

        it('Should mint during raffle if caller is subscribed', async function () {
            if (!(await contract.isActive())) await contract.toggleActive();

            if (!(await contract.isSubscriptionOpen()))
                await contract.toggleSubscription();

            if (!(await contract.isRaffleActive()))
                await contract.toggleRaffle();

            await contract.connect(addr3).subscribeToRaffle({
                value: (await contract.subscriptionFee()).toString(),
            });

            await contract.connect(addr3).mintNFTDuringRaffle(1);
            await expect(await contract.totalSupply()).to.equal(1);
            await expect(await contract.ownerOf(0)).to.equal(addr3.address);
        });
    });

    describe('Whitelist Sale', async function () {
        let merkleTree: MerkleTree;
        let leaves: string[];
        let proof: string[];

        beforeEach(async function () {
            leaves = ethAddressList.map((addr) =>
                defaultAbiCoder.encode(['address'], [addr])
            );

            merkleTree = new MerkleTree(leaves, keccak256, {
                hashLeaves: true,
                sortPairs: true,
            });

            await contract.setRoot(merkleTree.getHexRoot());
            proof = merkleTree.getHexProof(keccak256(leaves[0]));
            await contract.toggleActive();
        });

        it('Should fail if Presale is not active', async function () {
            expect(
                contract.connect(addrs[3]).mintNFTDuringPresale(1, proof, {
                    value: await (await contract.NFTPrice()).toString(),
                })
            ).to.be.revertedWith('Presale is not opened yet');
        });

        it('Should fail if not Whitelisted', async function () {
            expect(
                contract.mintNFTDuringPresale(1, proof, {
                    value: await (await contract.NFTPrice()).toString(),
                })
            ).to.be.revertedWith('Not whitelisted');
        });

        it('Should mint if Whitelisted', async function () {
            await contract.togglePresale();
            expect(
                await contract.mintNFTDuringPresale(2, proof, {
                    value: await ((await contract.NFTPrice()) * 2).toString(),
                })
            );
        });

        it('Should fail if incorrect Price', async function () {
            await contract.togglePresale();
            await expect(
                contract.mintNFTDuringPresale(3, proof, {
                    value: await ((await contract.NFTPrice()) * 2).toString(),
                })
            ).to.be.revertedWith('Ether value sent is not correct');
        });

        it('Should fail if over max presale', async function () {
            await contract.togglePresale();
            await expect(
                contract.mintNFTDuringPresale(7, proof, {
                    value: await ((await contract.NFTPrice()) * 7).toString(),
                })
            ).to.be.revertedWith('Purchase exceeds max whitelisted');
        });

        it('Should fail free mint if claim more than 1 NFT', async function () {
            await contract.togglePresale();
            await contract.toggleFreeMint();
            await expect(
                contract.mintNFTDuringPresale(2, proof)
            ).to.be.revertedWith('Cannot purchase this many tokens');
        });

        it('Should free mint one NFT if free mint open', async function () {
            await contract.togglePresale();
            await contract.toggleFreeMint();
            await expect(contract.mintNFTDuringPresale(1, proof));
        });

        it('Should fail free mint if already claimed', async function () {
            await contract.togglePresale();
            await contract.toggleFreeMint();
            await expect(contract.mintNFTDuringPresale(1, proof));
            await expect(
                contract.mintNFTDuringPresale(1, proof)
            ).to.be.revertedWith('Already claimed giveaway');
        });
    });

    describe('Public Sale', async function () {
        beforeEach(async function () {
            await contract.toggleActive();
        });

        it('Should fail if public sale not opened', async function () {
            await expect(
                contract.connect(addr2).mintNFT(1, {
                    value: await ((await contract.NFTPrice()) * 11).toString(),
                })
            ).to.be.revertedWith('PublicSale is not active');
        });

        it('Should fail if buy limit is reached', async function () {
            await contract.togglePublicSale();
            await expect(
                contract.connect(addr2).mintNFT(11, {
                    value: await ((await contract.NFTPrice()) * 11).toString(),
                })
            ).to.be.revertedWith('Cannot mint above limit');
        });

        it('Should fail if Ether value sent is not correct', async function () {
            await contract.togglePublicSale();

            await expect(
                contract.connect(addr2).mintNFT(2, {
                    value: await ((await contract.NFTPrice()) * 1).toString(),
                })
            ).to.be.revertedWith('Ether value sent is not correct');
        });

        it('Should mint 2 NFT', async function () {
            await contract.togglePublicSale();

            await expect(
                await contract.connect(addr2).mintNFT(2, {
                    value: await ((await contract.NFTPrice()) * 2).toString(),
                })
            );
            await expect(await contract.ownerOf(0)).to.equal(addr2.address);
            await expect(await contract.ownerOf(1)).to.equal(addr2.address);
            await expect(await contract.totalSupply()).to.equal(2);
        });

        it('Should withdraw the money', async function () {
            await contract.togglePublicSale();

            await expect(
                await contract.connect(addr2).mintNFT(3, {
                    value: await ((await contract.NFTPrice()) * 3).toString(),
                })
            );
            await expect(
                await contract.connect(addr2).mintNFT(3, {
                    value: await ((await contract.NFTPrice()) * 3).toString(),
                })
            );
            await expect(
                await contract.connect(addr3).mintNFT(3, {
                    value: await ((await contract.NFTPrice()) * 3).toString(),
                })
            );
            await expect(
                await contract.connect(addrs[4]).mintNFT(3, {
                    value: await ((await contract.NFTPrice()) * 3).toString(),
                })
            );
            await expect(
                await contract.connect(addrs[5]).mintNFT(3, {
                    value: await ((await contract.NFTPrice()) * 3).toString(),
                })
            );
            await expect(
                await contract.connect(addrs[6]).mintNFT(3, {
                    value: await ((await contract.NFTPrice()) * 3).toString(),
                })
            );
            await expect(
                await contract.connect(addrs[7]).mintNFT(3, {
                    value: await ((await contract.NFTPrice()) * 3).toString(),
                })
            );
            await expect(
                await contract.connect(addrs[8]).mintNFT(3, {
                    value: await ((await contract.NFTPrice()) * 3).toString(),
                })
            );
            await expect(
                await contract.connect(addrs[9]).mintNFT(3, {
                    value: await ((await contract.NFTPrice()) * 3).toString(),
                })
            );
            await expect(await contract.totalSupply()).to.equal(27);
        });
    });

    describe('change supply', function () {
        it('Should change the NFT supply', async function () {
            expect(await contract.MAX_NFT_PUBLIC()).to.equal(100);
            await contract.setTotalSupply(200);
            expect(await contract.MAX_NFT_PUBLIC()).to.equal(200);
        });
    });

    describe('change price', function () {
        it('Should change the NFT price', async function () {
            expect(await contract.NFTPrice()).to.equal(200000000000000000n);
            await contract.setNFTPrice(20000000000000000n);
            expect(await contract.NFTPrice()).to.equal(20000000000000000n);
        });
    });

    describe('Token URI', function () {
        it('Should set the right URI', async function () {
            await contract.toggleActive();
            await contract.togglePublicSale();
            await expect(
                await contract.connect(addrs[1]).mintNFT(1, {
                    value: await ((await contract.NFTPrice()) * 1).toString(),
                })
            );
            await expect(
                await contract.connect(addrs[1]).mintNFT(2, {
                    value: await ((await contract.NFTPrice()) * 2).toString(),
                })
            );
            await contract.setURI('https://hiddenTest/');
            expect(await contract.tokenURI(0)).to.equal('https://hiddenTest/0');
            expect(await contract.tokenURI(2)).to.equal('https://hiddenTest/2');
            await contract.setURI('https://test/');
            expect(await contract.tokenURI(0)).to.equal('https://test/0');
            expect(await contract.tokenURI(2)).to.equal('https://test/2');
        });

        it('Should fail for non existing token', async function () {
            await expect(contract.tokenURI(4)).to.be.reverted;
        });
    });
});
