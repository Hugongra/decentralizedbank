import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { XAccount } from "./account";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { SystemAccount } from "./system_account";
import { TokenAccount } from "./token_account";
import { PROGRAM } from "../config";

export class Asset extends XAccount {

    readonly version: number;
    readonly lastUpdate: {
        slot: BN;
        stale: boolean;
    };
    readonly bank: PublicKey;
    readonly mintPubkey: PublicKey;
    readonly representativeMintPubkey: PublicKey;
    readonly mintDecimals: number;
    readonly depositAmount: BN;
    readonly borrowAmount: BN;
    readonly depositGlobalRate: BN;
    readonly borrowGloablRate: BN;
    readonly depositApr: number;
    readonly borrowApr: number;
    readonly config: AssetConfig;

    constructor(pubKey: PublicKey, data: any) {
        super(pubKey, data != null);
        if (data != null) {
            this.version = data.version;
            this.lastUpdate = data.lastUpdate;
            this.bank = data.bank;
            this.mintPubkey = data.mintPubkey;
            this.representativeMintPubkey = data.representativeMintPubkey;
            this.mintDecimals = data.mintDecimals;
            this.depositAmount = data.depositAmount;
            this.borrowAmount = data.borrowAmount;
            this.depositGlobalRate = data.depositGlobalRate;
            this.borrowGloablRate = data.borrowGlobalRate;
            this.depositApr = data.depositApr;
            this.borrowApr = data.borrowApr;
            this.config = data.config;
        }
    }

    static async reserveVaultPublicKey(mint: PublicKey, bank: PublicKey): Promise<PublicKey> {
        if (mint?.equals(PublicKey.default) || mint == undefined) {
            return PublicKey.findProgramAddressSync(
                [Buffer.from("reserve"), bank.toBuffer()],
                PROGRAM.programId
            )[0];
        } else {
            return await getAssociatedTokenAddress(mint, bank, true);
        }
    }

    async reserveVaultFactory(): Promise<SystemAccount | TokenAccount> {
        const publicKey = await Asset.reserveVaultPublicKey(this.mintPubkey, this.bank);
        if (this.native) {
            return await SystemAccount.from(publicKey);
        } else {
            return await TokenAccount.from(publicKey, this.mintPubkey, this.mintDecimals);
        }
    }

    async collateralVaultFactory(): Promise<TokenAccount> {
        return await TokenAccount.factory(this.bank, true, this.representativeMintPubkey, this.mintDecimals);
    }

    async depositVaultFactory(userPubKey: PublicKey): Promise<TokenAccount> {
        return await TokenAccount.factory(userPubKey, false, this.representativeMintPubkey, this.mintDecimals);
    }

    async userReserveVaultFactory(userPubKey: PublicKey): Promise<SystemAccount | TokenAccount> {
        if (this.native) {
            return await SystemAccount.from(userPubKey);
        } else {
            return await TokenAccount.factory(userPubKey, false, this.mintPubkey, this.mintDecimals);
        }
    }

    async feeVaultFactory(feeVault: PublicKey): Promise<SystemAccount | TokenAccount> {
        if (this.native) {
            return await SystemAccount.from(feeVault);
        } else {
            return await TokenAccount.from(feeVault, this.mintPubkey, this.mintDecimals);
        }
    }

    get native () {
        return this.mintPubkey.equals(PublicKey.default);
    }

    json() {
        return {
            version: this.version,
            lastUpdate: this.lastUpdate,
            bank: this.bank?.toBase58(),
            mintPubkey: this.mintPubkey?.toBase58(),
            representativeMintPubkey: this.representativeMintPubkey?.toBase58(),
            mintDecimals: this?.mintDecimals,
            depositAmount: this.depositAmount?.toString(),
            borrowAmount: this.borrowAmount?.toString(),
            depositGlobalRate: this.depositGlobalRate?.toString(),
            borrowGloablRate: this.borrowGloablRate?.toString(),
            depositApr: this.depositApr,
            borrowApr: this.borrowApr,
            config: {
                optimalUtilizationRate: this.config?.optimalUtilizationRate,
                depositLimit: this.config?.depositLimit,
                maxDepositApr: this.config?.maxDepositApr,
                minDepositApr: this.config?.minDepositApr,
                borrowLimit: this.config?.borrowLimit,
                maxBorrowApr: this.config?.maxBorrowApr,
                minBorrowApr: this.config?.minBorrowApr,
                rSlope1: this.config?.rSlope1,
                rSlope2: this.config?.rSlope2,
                borrowWeight: this.config?.borrowWeight,
                borrowFee: this.config?.borrowFee,
                openLtv: this.config?.openLtv,
                closeLtv: this.config?.closeLtv,
                maxCloseLtv: this.config?.maxCloseLtv,
                liquidationFee: this.config?.liquidationFee,
                oracleId: this.config?.oracleId?.toBase58()
            },
        };
    }

}

export interface AssetConfig {
    optimalUtilizationRate: number;
    depositLimit: number;
    maxDepositApr: number;
    minDepositApr: number;
    borrowLimit: number;
    maxBorrowApr: number;
    minBorrowApr: number;
    rSlope1: number;
    rSlope2: number;
    borrowWeight: number;
    borrowFee: number;
    openLtv: number;
    closeLtv: number;
    maxCloseLtv: number;
    liquidationFee: number;
    oracleId: PublicKey;
}

export function assetConfigFactory(minDepositApr: number, minBorrowApr: number, borrowWeight: number): AssetConfig {
    return {
        // ----- Utilization -----
        optimalUtilizationRate: 8000,
    
        // ----- Deposits -----
        depositLimit: 10000,
        maxDepositApr: 500,
        minDepositApr,
    
        // ----- Borrows -----
        borrowLimit: 10000,
        maxBorrowApr: 1000,
        minBorrowApr,
        rSlope1: 500,
        rSlope2: 4400,
        borrowWeight,
        borrowFee: 2400,
    
        // ----- Risk Management -----
        openLtv: 7500,
        closeLtv: 8000,
        maxCloseLtv: 8500,
        liquidationFee: 500,
        // ----- Administrative -----
        oracleId: new PublicKey('B4S8yri9mqnznN9mBZtSerhk5zZWjHHNa4H4EGhyCwzR')
    };
}
