import { Transaction } from '@solana/web3.js';
import { sha256 } from 'js-sha256';
import { Buffer } from 'buffer';

export abstract class XInstruction {

    #discriminator: Uint8Array;

    constructor(method: string) {
        this.#discriminator = Uint8Array.from(sha256.array(method).slice(0, 8));
    }

    abstract getTransaction(): Transaction;

    getData(args?: Uint8Array) {
        if (args) {
            return Buffer.concat([this.#discriminator, args]);
        }
        return Buffer.from(this.#discriminator);
    }

}