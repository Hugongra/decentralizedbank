import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { CONNECTION, PROGRAM } from "../config";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { Asset } from "./asset";
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

    static pubKeyFactory(assetPubKey: PublicKey, userWalletPubKey: PublicKey): PublicKey {
        return PublicKey.findProgramAddressSync(
            [Buffer.from("deposit"), assetPubKey.toBuffer(), userWalletPubKey.toBuffer()],
            PROGRAM.programId
        )[0];
    }

    static async depositVaultPublicKeyFactory(assetPubKey: PublicKey, userWalletPubKey: PublicKey): Promise<PublicKey> {
        const asset = await Asset.from(assetPubKey);
        return await getAssociatedTokenAddress(asset.representativeMintPubkey, userWalletPubKey, false);
    }

    static async from(publicKey: PublicKey): Promise<Deposit> {
        const data = await PROGRAM.account.deposit.fetch(publicKey);
        return new Deposit(publicKey, data);
    }

    static async factory(assetPublicKey: PublicKey, userWalletPublicKey: PublicKey): Promise<Deposit> {
        const pubKey = Deposit.pubKeyFactory(assetPublicKey, userWalletPublicKey);
        const accountInfo = await CONNECTION.getAccountInfo(pubKey);
        if (accountInfo != null) {
            return await this.from(pubKey);
        }
        return new Deposit(pubKey, accountInfo);
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