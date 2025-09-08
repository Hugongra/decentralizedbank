import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { XAccount } from "./account";

export class Borrow extends XAccount {

    readonly version: number;
    readonly lastUpdate: {
        slot: BN;
        stale: boolean;
    };
    readonly user: PublicKey;
    readonly asset: PublicKey;
    readonly amount: BN;
    readonly borrowRateIndex: BN;
    readonly deposit: PublicKey;
    readonly collateralAmount: BN;
    readonly liquidating: boolean;

    constructor(pubKey: PublicKey, data: any) {
        super(pubKey, data != null);
        if (data) {
            this.version = data.version;
            this.lastUpdate = data.lastUpdate;
            this.user = data.user;
            this.asset = data.asset;
            this.amount = data.amount;
            this.borrowRateIndex = data.borrowRateIndex;
            this.deposit = data.deposit;
            this.collateralAmount = data.collateralAmount;
            this.liquidating = data.liquidating;
        }
    }

    json() {
        return {
            version: this.version,
            lastUpdate: this.lastUpdate,
            user: this.user?.toBase58(),
            asset: this.asset?.toBase58(),
            amount: this.amount?.toString(),
            borrowRateIndex: this.borrowRateIndex?.toString(),
            deposit: this.deposit?.toBase58(),
            collateralAmount: this.collateralAmount?.toString(),
            liquidating: this.liquidating
        };
    }

}
