import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { XAccount } from "./account";

export class Deposit extends XAccount {

    readonly version: number;
    readonly lastUpdate: {
        slot: BN;
        stale: boolean;
    };
    readonly user: PublicKey;
    readonly asset: PublicKey;
    readonly amount: BN;
    readonly depositRateIndex: BN;

    constructor(pubKey: PublicKey, data: any) {
        super(pubKey, data != null);
        if (data) {
            this.version = data.version;
            this.lastUpdate = data.lastUpdate;
            this.user = data.user;
            this.asset = data.asset;
            this.amount = data.amount;
            this.depositRateIndex = data.depositRateIndex;
        }
    }

    json() {
        return {
            version: this.version,
            lastUpdate: this.lastUpdate,
            user: this.user?.toBase58(),
            asset: this.asset?.toBase58(),
            amount: this.amount?.toString(),
            depositRateIndex: this.depositRateIndex?.toString()
        };
    }

}