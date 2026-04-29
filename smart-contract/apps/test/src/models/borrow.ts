import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { XAccount } from "./account";
import { CONNECTION, PROGRAM } from "../config";

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

    static pubKeyFactory(borrowAssetPubKey: PublicKey, depositAssetPubKey: PublicKey, userWalletPubKey: PublicKey): PublicKey {
        return PublicKey.findProgramAddressSync(
            [Buffer.from("borrow"), borrowAssetPubKey.toBuffer(), depositAssetPubKey.toBuffer(), userWalletPubKey.toBuffer()],
            PROGRAM.programId
        )[0];
    }

    static async from(publicKey: PublicKey): Promise<Borrow> {
        const data = await PROGRAM.account.borrow.fetch(publicKey);
        return new Borrow(publicKey, data);
    }

    static async factory(borrowAssetPubKey: PublicKey, depositAssetPubKey: PublicKey, userWalletPubKey: PublicKey): Promise<Borrow> {
        const pubKey = Borrow.pubKeyFactory(borrowAssetPubKey, depositAssetPubKey, userWalletPubKey);
        const accountInfo = await CONNECTION.getAccountInfo(pubKey);
        if (accountInfo != null) {
            return await this.from(pubKey);
        }
        return new Borrow(pubKey, accountInfo);
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
