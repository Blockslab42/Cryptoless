// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers, upgrades } from 'hardhat';

async function deploy() {
    const [deployer] = await ethers.getSigners();

    console.log('Deploying contracts with the account:', deployer.address);

    console.log('Account balance:', (await deployer.getBalance()).toString());

    const Token = await ethers.getContractFactory('nft');
    const token = await Token.deploy();

    const Auction = await ethers.getContractFactory('EnglishAuction');
    const auction = await Auction.deploy(
        '0x5d17a277c4ee9a605cfad260e09799ead979e4fe',
        0,
        ethers.utils.parseEther('1')
    );

    await auction.deployed();

    console.log('Token address:', token.address);
    console.log('Auction address:', auction.address);

    // await token.toggleActive();
    // await sleep(5000);
    // await token.mintNFT(0, 111);
    // await sleep(5000);
    // await token.approve(0, auction.address);
    // await sleep(5000);
    // await token.toggleActive();
    // await sleep(5000);
}
async function deployProxy() {
    const [deployer] = await ethers.getSigners();

    console.log('Deploying contracts with the account:', deployer.address);

    console.log('Account balance:', (await deployer.getBalance()).toString());

    const Token = await ethers.getContractFactory('nftUpgradeable');

    const token = await upgrades.deployProxy(Token, []);

    await token.deployed();
    console.log('Token address:', token.address);
}

async function runNft() {
    const [deployer] = await ethers.getSigners();
    const token = await ethers.getContractAt(
        'nft',
        process.env.MAINNET_NFT as string,
        deployer
    );

    //await token.toggleActive();
    //await token.mintNFT(0, 13924);

    await token.toggleActive();

    // console.log(process.env.MAINNET_AUCTION);
    // await token.approve(process.env.MAINNET_AUCTION as string, 0);
}

async function deployAuction() {
    const [deployer] = await ethers.getSigners();

    const Auction = await ethers.getContractFactory('EnglishAuction');
    const auction = await Auction.deploy(
        process.env.MAINNET_NFT as string,
        0,
        ethers.utils.parseEther('1')
    );

    await auction.deployed();

    console.log('Auction address:', auction.address);
}

async function runAuction() {
    const [deployer] = await ethers.getSigners();
    const auction = await ethers.getContractAt(
        'EnglishAuction',
        process.env.MAINNET_AUCTION as string,
        deployer
    );

    await auction.start('604800');

    //await auction.end();
}

deployProxy()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

// main()
//     .then(() => process.exit(0))
//     .catch((error) => {
//         console.error(error);
//         process.exit(1);
//     });

function sleep(milliseconds: number) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
