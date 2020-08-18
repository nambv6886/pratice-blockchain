export class Blockchain {
    symbol: string = '';
    name: string = '';
    url: string = '';
    is_testnet: boolean = false;

    constructor(symbol, name, url, is_testnet) {
        this.symbol = symbol;
        this.name = name;
        this.url = url;
        this.is_testnet = is_testnet;
    }
}