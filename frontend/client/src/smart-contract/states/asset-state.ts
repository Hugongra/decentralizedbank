import * as borsh from 'borsh';
import { Buffer } from 'buffer';
import { PublicKey } from '@solana/web3.js';
import { CONNECTION } from '..';
import { TokenAccount } from '../models/vault-account';
import { PROGRAM_ID } from '../../environments/env';

export class AssetState {

    readonly pubKey: PublicKey;
    readonly version: number;
    readonly lastUpdate: {
        slot: number;
        slate: boolean;
    };
    readonly bank: PublicKey;
    readonly mintPubkey: PublicKey;
    readonly representativeMintPubkey: PublicKey;
    readonly mintDecimals: number;
    readonly depositAmount: bigint;
    readonly borrowAmount: bigint;
    readonly depositGlobalRate: bigint;
    readonly borrowGlobalRate: bigint;
    readonly depositApr: number;
    readonly borrowApr: number;
    readonly config: AssetConfig;

    static SCHEMA = { struct: {
        version: 'u8',
        last_update: {
            struct: {
                slot: 'u64',
                stale: 'bool',
            },
        },
        bank: { array: { type: 'u8', len: 32 } },
        mint_pubkey: { array: { type: 'u8', len: 32 } },
        representative_mint_pubkey: { array: { type: 'u8', len: 32 } },
        mint_decimals: 'u8',
        deposit_amount: 'u64',
        borrow_amount: 'u64',
        deposit_global_rate: 'u64',
        borrow_global_rate: 'u64',
        deposit_apr: 'u16',
        borrow_apr: 'u16',
        config: {
            struct: {
                optimal_utilization_rate: 'u16',
                deposit_limit: 'u16',
                max_deposit_apr: 'u16',
                min_deposit_apr: 'u16',
                borrow_limit: 'u16',
                max_borrow_apr: 'u16',
                min_borrow_apr: 'u16',
                r_slope_1: 'u16',
                r_slope_2: 'u16',
                borrow_weight: 'u16',
                borrow_fee: 'u16',
                open_ltv: 'u16',
                close_ltv: 'u16',
                max_close_ltv: 'u16',
                liquidation_fee: 'u16',
                oracle_id: { array: { type: 'u8', len: 32 } },
            },
        },
    }};

    constructor(pubKey: PublicKey, accountInfo: any) {
        this.pubKey = pubKey;
        const data = borsh.deserialize(AssetState.SCHEMA, accountInfo.data.slice(8)) as any;
        this.version = data.version;
        this.lastUpdate = data.last_update;
        this.bank = new PublicKey(data.bank);
        this.mintPubkey = new PublicKey(data.mint_pubkey);
        this.representativeMintPubkey = new PublicKey(data.representative_mint_pubkey);
        this.mintDecimals = data.mint_decimals;
        this.depositAmount = data.deposit_amount;
        this.borrowAmount = data.borrow_amount;
        this.depositGlobalRate = data.deposit_global_rate;
        this.borrowGlobalRate = data.borrow_global_rate;
        this.depositApr = data.deposit_apr;
        this.borrowApr = data.borrow_apr;
        this.config = {
            optimalUtilizationRate: data.config.optimal_utilization_rate,
            depositLimit: data.config.deposit_limit,
            maxDepositApr: data.config.max_deposit_apr,
            minDepositApr: data.config.min_deposit_apr,
            borrowLimit: data.config.borrow_limit,
            maxBorrowApr: data.config.max_borrow_apr,
            minBorrowApr: data.config.min_borrow_apr,
            rSlope1: data.config.r_slope_1,
            rSlope2: data.config.r_slope_2,
            borrowWeight: data.config.borrow_weight,
            borrowFee: data.config.borrow_fee,
            openLtv: data.config.open_ltv,
            closeLtv: data.config.close_ltv,
            maxCloseLtv: data.config.max_close_ltv,
            liquidationFee: data.config.liquidation_fee,
            oracleId: new PublicKey(data.config.oracle_id)
        };
    }

    static fetchPublicKey(bank: PublicKey, mint?: PublicKey): PublicKey {
        return PublicKey.findProgramAddressSync(
            [Buffer.from("asset"), bank.toBuffer(), mint ? mint.toBuffer() : PublicKey.default.toBuffer()],
            new PublicKey(PROGRAM_ID)
        )[0];
    }

    static fetchReserveVaultPublicKey(bank: PublicKey, mint: PublicKey): PublicKey {
        if (mint.equals(PublicKey.default)) {
            return PublicKey.findProgramAddressSync(
                [Buffer.from("reserve"), bank.toBuffer()],
                new PublicKey(PROGRAM_ID)
            )[0];
        } else {
            return TokenAccount.fetchPublicKey(bank, mint);
        }
    }

    static fetchCollateralVaultPublicKey(bank: PublicKey, representativeMintPubkey: PublicKey): PublicKey {
        return TokenAccount.fetchPublicKey(bank, representativeMintPubkey);
    }

    static fetchFeeVaultPublicKey(feeVault: PublicKey, mint: PublicKey): PublicKey {
        if (mint.equals(PublicKey.default)) {
            return feeVault;
        } else {
            return TokenAccount.fetchPublicKey(feeVault, mint);
        }
    }

    static async factory(mint?: PublicKey): Promise<AssetState> {
        const pubKey = AssetState.fetchPublicKey(mint);
        const accountInfo = await CONNECTION.getAccountInfo(pubKey);
        return new AssetState(pubKey, accountInfo);
    }

    static async from(pubKey: PublicKey): Promise<AssetState> {
        const accountInfo = await CONNECTION.getAccountInfo(pubKey);
        return new AssetState(pubKey, accountInfo);
    }

    get native(): boolean {
        return this.mintPubkey.equals(PublicKey.default);
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
