import Web3 from 'web3';
import * as config from 'config';
import axois from 'axios';
const EthereumTx = require('ethereumjs-tx').Transaction;

import { Blockchain } from "./blockchain";
import { Currency } from '../models/currency';

import logger from "utils/logger";
import { errorType } from "utils";
import { Utils } from 'utils/utils';
import { Address } from 'models/address';

export class ETH extends Blockchain {
    web3: Web3;
    gas_price: number = 0;
    gas_price_time: number = 0;

    constructor(symbol, name, url, is_testnet) {
        super(symbol, name, url, is_testnet);
        this.web3 = new Web3(this.url);
        logger.log('info', `${this.symbol} init`);
    }

    async create_address() {
        const createdAccount = this.web3.eth.accounts.create();
        const address = createdAccount.address;
        const privateKey = createdAccount.privateKey;
        return {
            address,
            privateKey
        };
    }

    async getTransactionReceipt(hash: string) {
        return await this.web3.eth.getTransactionReceipt(hash);
    };

    async getBlockNumber() {
        return await this.web3.eth.getBlockNumber();
    }

    async getBlockByHeight(block_height: number) {
        return await this.web3.eth.getBlock(block_height, true);
    }

    async getLogs(address: string[], block_number: number) {
        return await this.web3.eth.getPastLogs({
            address,
            fromBlock: block_number,
            toBlock: block_number
        });
    }

    async getBalance(symbol: string, address: string) {
        const currency = await Currency.get(symbol);

        if(!currency) {
            throw { stack: errorType.CURRENCY_NOT_EXISTS }
        }

        if(symbol.toUpperCase() == 'ETH' || symbol.toUpperCase() == 'RETH') {
            const balance = await this.web3.eth.getBalance(address);
            return this.web3.utils.fromWei(String(balance), 'ether');
        }

        return 0;
    }

    async getHotWalletBalance(symbol: string, address: string) {
        return await this.getBalance(symbol, address);
    }
    
    async getGasPrice() {
        try {
            if(this.gas_price_time + 10*60*1000 < Date.now()) {
                const gas_url = config.get('gas_price_url');
                const res = await axois.get(gas_url, { timeout: 10000 });
                this.gas_price = Math.min(res.data.fastest / 10, 100);
                this.gas_price_time = Date.now();
            }
        } catch (error) {
            logger.error(error);
        }

        return this.gas_price || 30;
    }

    async transfer(symbol: string, from_address: string, to_address: string, quantity: number, index: number = 0, hot_wallet_address: string, hot_wallet_private_key: string) {
        const currency = await Currency.get(symbol);
        if(!currency) {
            throw { stack: errorType.CURRENCY_NOT_EXISTS};
        }

        let private_key: string;
        if(from_address.toLowerCase() == hot_wallet_address.toLowerCase()) {
            let key: string = config.get('hot_wallet_secret');
            key = key.substring(10) + key.substr(0, 10);
            private_key = Utils.decrypt(hot_wallet_private_key, key);
        } else {
            private_key = await Address.get_private_key(from_address);
        }
        if(!private_key) {
            throw { stack: errorType.ADDRESS_INVALID };
        }

        const count = await this.web3.eth.getTransactionCount(from_address);
        const gasPrice = await this.getGasPrice();

        const rawTransaction: any = {
            from: from_address,
            gasPrice: this.web3.utils.toHex(this.web3.utils.toWei(String(gasPrice), 'gwei')),
            nonce: this.web3.utils.toHex(count + index)
        };

        if(symbol.toUpperCase() == 'ETH' || symbol.toUpperCase() == 'RETH') {
            rawTransaction.gasLimit = this.web3.utils.toHex('21000');
            rawTransaction.to = to_address;
            rawTransaction.value = this.web3.utils.toHex(this.web3.utils.toWei(String(quantity), 'ether'));
        }

        logger.info(rawTransaction);

        let opts = {};
        if(this.is_testnet) {
            opts = { 'chain': 'ropsten' };
        }

        const transaction = new EthereumTx(rawTransaction, opts);
        const privateKey = Buffer.from(private_key.length == 66 ? private_key.substr(2) : private_key, 'hex');
        transaction.sign(privateKey);

        return this.web3.eth.sendSignedTransaction('0x' + transaction.serialize().toString('hex'));
    }

    async transfer_from_hot(symbol: string, to_address: string, quantity: number, index: number = 0, wallet: any) {
        if(!wallet) {
            throw { stack: errorType.WALLET_NOT_EXIST };
        }

        return this.transfer(symbol, wallet.hot_wallet_address, to_address, quantity, index, wallet.hot_wallet_address, wallet.hot_wallet_private_key);
    }

    async transfer_to_hot(symbol: string, from_address: string, quantity: number, index: number = 0, wallet: any) {
        if(!wallet) {
            throw { stack: errorType.WALLET_NOT_EXIST };
        }

        return this.transfer(symbol, from_address, wallet.hot_wallet_address, quantity, index, wallet.hot_wallet_address, wallet.hot_wallet_private_key);
    }

    async check_address(address: string, wallet: any) {
        const currencies_list = await Currency.list();

        const addressFound = await Address.get(address);
        const currency = currencies_list.find((x: any) => {
            x.blockchain_symbol == this.symbol && !x.is_token
        })
        if(currency) {
            const balance = await this.getBalance(currency.symbol, address);
            logger.info(`[${currency.symbol}][${address}]: ${balance} `);
            if(balance >= currency.minimum_threshold) {
                // send to hot
                const gas_price = await this.getGasPrice();
                const fee = (gas_price * 21 / 1000000) + 0.0001;
                const amount = Number(balance) - fee;
                logger.silly(`[TransferToHot][${currency.symbol}]: ${address} ${amount}`);
                const trans = await this.transfer_to_hot(currency.symbol, address, amount, 0, wallet);
                logger.silly(`[TransferToHot]: success, ${trans}`);
            }
        }
    }   

}