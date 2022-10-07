import * as dotenv from 'dotenv';

import { HardhatUserConfig } from 'hardhat/config';
import '@nomiclabs/hardhat-ethers';
import '@nomicfoundation/hardhat-toolbox';
import '@nomiclabs/hardhat-etherscan';
import '@nomicfoundation/hardhat-chai-matchers';
import '@typechain/hardhat';
import 'hardhat-gas-reporter';
import 'solidity-coverage';
import '@nomiclabs/hardhat-etherscan';
import { BigNumber, Contract, ethers } from 'ethers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { env } from 'process';

const {
    ALCHEMY,
    PRIVATE_KEY,
    POLYGON_SCAN,
    RINKEBY_URL,
    ALCHEMY_KEY,
    RINKEBY_API_KEY,
} = process.env;
const account = {
    mnemonic: 'bleak west pretty uncover robot weird resource mistake buzz detail symptom slush',
    path: "m/44'/60'/0'/0",
    initialIndex: 0,
    count: 20,
    passphrase: '',
};

/** @type import('hardhat/config').HardhatUserConfig */
const config: HardhatUserConfig = {
    solidity: {
        version: '0.8.14',
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
        },
    },
    paths: {
        artifacts: './artifacts',
    },
    defaultNetwork: 'hardhat',
    networks: {
        hardhat: {
            chainId: 1337, // network config 1337 is for test for exemple mainnet ETH : 1
        },
        localhost: {
            url: 'http://localhost:8545',
            chainId: 1337,
        },
        rinkeby: {
            url:
                'https://rinkeby.infura.io/v3/3b9c944ca9d444be837d554e0db50d4d',
            accounts: account,
        },
    },
    gasReporter: {
        enabled: true,
        currency: 'EUR',
        gasPrice: 60,
    },
    etherscan: {
        apiKey: 'YM6MG2HTTMXC3MK42YTJG3QRPXGD359YVD',
        //   apiKey: process.env.ETHERSCAN_API_KEY,
    },
};

export default config;
