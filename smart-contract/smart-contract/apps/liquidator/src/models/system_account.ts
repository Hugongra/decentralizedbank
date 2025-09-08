import { PublicKey } from "@solana/web3.js";
import { XAccount } from "./account";
import { CONNECTION } from "../config";
import { BN } from "@coral-xyz/anchor";

export class SystemAccount extends XAccount {

    lamports: BN;
    
    constructor(pubKey: PublicKey, init: boolean = false, amount?: number) {
        super(pubKey, init);
        this.lamports = new BN(amount || 0);
    }

    static async from(pubKey: PublicKey) {
        const accountInfo = await CONNECTION.getAccountInfo(pubKey);
        return new SystemAccount(pubKey, true, accountInfo?.lamports);
    }

    get amount(): number {
        return this.lamports.div(new BN(10).pow(new BN(9))).toNumber();
    }

    json() {
        return {
            lamports: this.lamports?.toString()
        };
    }

}
