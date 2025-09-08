import { PublicKey } from "@solana/web3.js";
import { XAccount } from "./account";

export class Bank extends XAccount {
    
    readonly version: number;
    readonly bumpSeed: number;
    readonly admin: PublicKey;
    readonly liquidator: PublicKey;
    readonly feeVault: PublicKey;
    readonly defcon: number;

    constructor(pubKey: PublicKey, data: any) {
        super(pubKey, data != null);
        if (data) {
            this.version = data.version;
            this.bumpSeed = data.bumpSeed;
            this.admin = data.admin;
            this.liquidator = data.liquidator;
            this.feeVault = data.feeVault;
            this.defcon = data.defcon;
        }
    }

    json(): any {
        return {
            version: this.version,
            bumpSeed: this.bumpSeed,
            admin: this.admin?.toString(),
            liquidator: this.liquidator?.toString(),
            feeVault: this.feeVault?.toString(),
            defcon: this.defcon
        };
    }

}