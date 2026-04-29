import { PublicKey } from "@solana/web3.js";

export abstract class XAccount {

    publicKey: PublicKey;

    init: boolean;

    constructor(publicKey: PublicKey, init: boolean) {
        this.publicKey = publicKey;
        this.init = init;
    }

    abstract json(): any;

}
