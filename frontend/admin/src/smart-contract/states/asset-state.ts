import * as borsh from 'borsh';
import { Buffer } from 'buffer';
import { PublicKey, Transaction, TransactionInstruction, SYSVAR_CLOCK_PUBKEY, SystemProgram } from '@solana/web3.js';
import { XInstruction } from '../pojos/x-instruction';
import { PROGRAM_ID } from '../../environments/env';
import { ASSOCIATED_TOKEN_PROGRAM_ID, bigintToNumber, bpsToPercent, percentToBps, PROGRAM_ID_PUBKEY, TOKEN_PROGRAM_ID } from '..';
import { TokenAccount } from '../pojos/vault-account';

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
    readonly depositAmount: number;
    readonly borrowAmount: number;
    readonly depositGlobalRate: number;
    readonly borrowGlobalRate: number;
    readonly depositApr: number;
    readonly borrowApr: number;
    readonly config: AssetConfig;

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
        this.depositAmount = bigintToNumber(data.deposit_amount, this.mintDecimals);
        this.borrowAmount = bigintToNumber(data.borrow_amount, this.mintDecimals);
        this.depositGlobalRate = bigintToNumber(data.deposit_global_rate, 15);
        this.borrowGlobalRate = bigintToNumber(data.borrow_global_rate, 15);
        this.depositApr = bpsToPercent(data.deposit_apr);
        this.borrowApr = bpsToPercent(data.borrow_apr);
        this.config = {
            optimalUtilizationRate: bpsToPercent(data.config.optimal_utilization_rate),
            depositLimit: bpsToPercent(data.config.deposit_limit),
            maxDepositApr: bpsToPercent(data.config.max_deposit_apr),
            minDepositApr: bpsToPercent(data.config.min_deposit_apr),
            borrowLimit: bpsToPercent(data.config.borrow_limit),
            maxBorrowApr: bpsToPercent(data.config.max_borrow_apr),
            minBorrowApr: bpsToPercent(data.config.min_borrow_apr),
            rSlope1: bpsToPercent(data.config.r_slope_1),
            rSlope2: bpsToPercent(data.config.r_slope_2),
            borrowWeight: bpsToPercent(data.config.borrow_weight),
            borrowFee: bpsToPercent(data.config.borrow_fee),
            openLtv: bpsToPercent(data.config.open_ltv),
            closeLtv: bpsToPercent(data.config.close_ltv),
            maxCloseLtv: bpsToPercent(data.config.max_close_ltv),
            liquidationFee: bpsToPercent(data.config.liquidation_fee),
            oracleId: new PublicKey(data.config.oracle_id)
        };
    }

    get reserveVaultPubkey(): PublicKey {
        return AssetState.fetchReserveVaultPublicKey(this.bank, this.mintPubkey);
    }

    get collateralVaultPubkey(): PublicKey {
        return TokenAccount.fetchPublicKey(this.bank, this.mintPubkey);
    }

}

export class AssetConfig {
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

    constructor(
        optimalUtilizationRate: number,
        depositLimit: number,
        maxDepositApr: number,
        minDepositApr: number,
        borrowLimit: number,
        maxBorrowApr: number,
        minBorrowApr: number,
        rSlope1: number,
        rSlope2: number,
        borrowWeight: number,
        borrowFee: number,
        openLtv: number,
        closeLtv: number,
        maxCloseLtv: number,
        liquidationFee: number,
        oracleId: PublicKey
    ) {
        this.optimalUtilizationRate = optimalUtilizationRate;
        this.depositLimit = depositLimit;
        this.maxDepositApr = maxDepositApr;
        this.minDepositApr = minDepositApr;
        this.borrowLimit = borrowLimit;
        this.maxBorrowApr = maxBorrowApr;
        this.minBorrowApr = minBorrowApr;
        this.rSlope1 = rSlope1;
        this.rSlope2 = rSlope2;
        this.borrowWeight = borrowWeight;
        this.borrowFee = borrowFee;
        this.openLtv = openLtv;
        this.closeLtv = closeLtv;
        this.maxCloseLtv = maxCloseLtv;
        this.liquidationFee = liquidationFee;
        this.oracleId = oracleId;
    }

    static SCHEMA = { struct: {
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
        oracle_id: { array: { type: 'u8', len: 32 } }
    }};

}

export class CreateSolInstruction extends XInstruction {

    #adminWallet: PublicKey;
    #mint: PublicKey;
    #representativeMint: PublicKey;
    #bank: PublicKey;
    #assetConfig: AssetConfig;
    
    constructor(
        adminWallet: PublicKey,
        mint: PublicKey,
        representativeMint: PublicKey,
        bank: PublicKey,
        assetConfig: AssetConfig
        ) {
        super('global:create_sol_asset');
        this.#adminWallet = adminWallet;
        this.#mint = mint;
        this.#representativeMint = representativeMint;
        this.#bank = bank;
        this.#assetConfig = assetConfig;
    }

    getTransaction() {
        const serializeArgs = (args: AssetConfig): Uint8Array => {
            const value = {
                optimal_utilization_rate: percentToBps(args.optimalUtilizationRate),
                deposit_limit: percentToBps(args.depositLimit),
                max_deposit_apr: percentToBps(args.maxDepositApr),
                min_deposit_apr: percentToBps(args.minDepositApr),
                borrow_limit: percentToBps(args.borrowLimit),
                max_borrow_apr: percentToBps(args.maxBorrowApr),
                min_borrow_apr: percentToBps(args.minBorrowApr),
                r_slope_1: percentToBps(args.rSlope1),
                r_slope_2: percentToBps(args.rSlope2),
                borrow_weight: percentToBps(args.borrowWeight),
                borrow_fee: percentToBps(args.borrowFee),
                open_ltv: percentToBps(args.openLtv),
                close_ltv: percentToBps(args.closeLtv),
                max_close_ltv: percentToBps(args.maxCloseLtv),
                liquidation_fee: percentToBps(args.liquidationFee),
                oracle_id: args.oracleId.toBuffer()
            };
            return borsh.serialize(AssetConfig.SCHEMA, value);
        };
        return new Transaction().add(new TransactionInstruction({
            keys: [
                {pubkey: this.#adminWallet, isSigner: true, isWritable: true},
                {pubkey: this.#representativeMint, isSigner: false, isWritable: false},
                {pubkey: this.#bank, isSigner: false, isWritable: false},
                {pubkey: AssetState.fetchPublicKey(this.#bank, this.#mint), isSigner: false, isWritable: true},
                {pubkey: AssetState.fetchReserveVaultPublicKey(this.#bank, this.#mint), isSigner: false, isWritable: true},
                {pubkey: TokenAccount.fetchPublicKey(this.#bank, this.#representativeMint), isSigner: false, isWritable: true},
                {pubkey: SystemProgram.programId, isSigner: false, isWritable: false},
                {pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false},
                {pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false},
                {pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false},
            ],
            programId: PROGRAM_ID_PUBKEY,
            data: this.getData(serializeArgs(this.#assetConfig))
        }));
    };
}

export class CreateTokenVaultsInstruction extends XInstruction {

    #adminWallet: PublicKey;
    #mint: PublicKey;
    #representativeMint: PublicKey;
    #bank: PublicKey;
    
    constructor(
        adminWallet: PublicKey,
        mint: PublicKey,
        representativeMint: PublicKey,
        bank: PublicKey
        ) {
        super('global:create_token_asset_vaults');
        this.#adminWallet = adminWallet;
        this.#mint = mint;
        this.#representativeMint = representativeMint;
        this.#bank = bank;
    }

    getTransaction() {
        return new Transaction().add(new TransactionInstruction({
            keys: [
                {pubkey: this.#adminWallet, isSigner: true, isWritable: true},
                {pubkey: this.#mint, isSigner: false, isWritable: false},
                {pubkey: this.#representativeMint, isSigner: false, isWritable: false},
                {pubkey: this.#bank, isSigner: false, isWritable: false},
                {pubkey: AssetState.fetchReserveVaultPublicKey(this.#bank, this.#mint), isSigner: false, isWritable: true},
                {pubkey: TokenAccount.fetchPublicKey(this.#bank, this.#representativeMint), isSigner: false, isWritable: true},
                {pubkey: SystemProgram.programId, isSigner: false, isWritable: false},
                {pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false},
                {pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false}
            ],
            programId: PROGRAM_ID_PUBKEY,
            data: this.getData()
        }));
    };
}

export class CreateTokenInstruction extends XInstruction {

    #adminWallet: PublicKey;
    #mint: PublicKey;
    #representativeMint: PublicKey;
    #bank: PublicKey;
    #assetConfig: AssetConfig;
    
    constructor(
        adminWallet: PublicKey,
        mint: PublicKey,
        representativeMint: PublicKey,
        bank: PublicKey,
        assetConfig: AssetConfig
        ) {
        super('global:create_token_asset');
        this.#adminWallet = adminWallet;
        this.#mint = mint;
        this.#representativeMint = representativeMint;
        this.#bank = bank;
        this.#assetConfig = assetConfig;
    }

    getTransaction() {
        const serializeArgs = (args: AssetConfig): Uint8Array => {
            const value = {
                optimal_utilization_rate: percentToBps(args.optimalUtilizationRate),
                deposit_limit: percentToBps(args.depositLimit),
                max_deposit_apr: percentToBps(args.maxDepositApr),
                min_deposit_apr: percentToBps(args.minDepositApr),
                borrow_limit: percentToBps(args.borrowLimit),
                max_borrow_apr: percentToBps(args.maxBorrowApr),
                min_borrow_apr: percentToBps(args.minBorrowApr),
                r_slope_1: percentToBps(args.rSlope1),
                r_slope_2: percentToBps(args.rSlope2),
                borrow_weight: percentToBps(args.borrowWeight),
                borrow_fee: percentToBps(args.borrowFee),
                open_ltv: percentToBps(args.openLtv),
                close_ltv: percentToBps(args.closeLtv),
                max_close_ltv: percentToBps(args.maxCloseLtv),
                liquidation_fee: percentToBps(args.liquidationFee),
                oracle_id: args.oracleId.toBuffer()
            };
            return borsh.serialize(AssetConfig.SCHEMA, value);
        };
        return new Transaction().add(new TransactionInstruction({
            keys: [
                {pubkey: this.#adminWallet, isSigner: true, isWritable: true},
                {pubkey: this.#mint, isSigner: false, isWritable: false},
                {pubkey: this.#representativeMint, isSigner: false, isWritable: false},
                {pubkey: this.#bank, isSigner: false, isWritable: false},
                {pubkey: AssetState.fetchPublicKey(this.#bank, this.#mint), isSigner: false, isWritable: true},
                {pubkey: AssetState.fetchReserveVaultPublicKey(this.#bank, this.#mint), isSigner: false, isWritable: false},
                {pubkey: TokenAccount.fetchPublicKey(this.#bank, this.#representativeMint), isSigner: false, isWritable: false},
                {pubkey: SystemProgram.programId, isSigner: false, isWritable: false},
                {pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false},
                {pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false},
            ],
            programId: PROGRAM_ID_PUBKEY,
            data: this.getData(serializeArgs(this.#assetConfig))
        }));
    };
}

export class UpdateAssetInstruction extends XInstruction {

    #adminWallet: PublicKey;
    #bank: PublicKey;
    #asset: PublicKey;
    #assetConfig: AssetConfig;
    
    constructor(
        bank: PublicKey,
        authorityWallet: PublicKey,
        asset: PublicKey,
        assetConfig: AssetConfig
        ) {
        super('global:update_asset');
        this.#bank = bank;
        this.#adminWallet = authorityWallet;
        this.#asset = asset;
        this.#assetConfig = assetConfig;
    }

    getTransaction() {
        const serializeArgs = (args: AssetConfig): Uint8Array => {
            const value = {
                optimal_utilization_rate: args.optimalUtilizationRate ? percentToBps(args.optimalUtilizationRate) : null,
                deposit_limit: args.depositLimit ? percentToBps(args.depositLimit) : null,
                max_deposit_apr: args.maxDepositApr ? percentToBps(args.maxDepositApr) : null,
                min_deposit_apr: args.minDepositApr ? percentToBps(args.minDepositApr) : null,
                borrow_limit: args.borrowLimit ? percentToBps(args.borrowLimit) : null,
                max_borrow_apr: args.maxBorrowApr ? percentToBps(args.maxBorrowApr) : null,
                min_borrow_apr: args.minBorrowApr ? percentToBps(args.minBorrowApr) : null,
                r_slope_1: args.rSlope1 ? percentToBps(args.rSlope1) : null,
                r_slope_2: args.rSlope2 ? percentToBps(args.rSlope2) : null,
                borrow_weight: args.borrowWeight ? percentToBps(args.borrowWeight) : null,
                borrow_fee: args.borrowFee ? percentToBps(args.borrowFee) : null,
                open_ltv: args.openLtv ? percentToBps(args.openLtv) : null,
                close_ltv: args.closeLtv ? percentToBps(args.closeLtv) : null,
                max_close_ltv: args.maxCloseLtv ? percentToBps(args.maxCloseLtv) : null,
                liquidation_fee: args.liquidationFee ? percentToBps(args.liquidationFee) : null,
                oracle_id: args.oracleId ? args.oracleId.toBuffer() : null
            };
            const schema = { struct: {
                optimal_utilization_rate: { option: 'u16' },
                deposit_limit: { option: 'u16' },
                max_deposit_apr: { option: 'u16' },
                min_deposit_apr: { option: 'u16' },
                borrow_limit: { option: 'u16' },
                max_borrow_apr: { option: 'u16' },
                min_borrow_apr: { option: 'u16' },
                r_slope_1: { option: 'u16' },
                r_slope_2: { option: 'u16' },
                borrow_weight: { option: 'u16' },
                borrow_fee: { option: 'u16' },
                open_ltv: { option: 'u16' },
                close_ltv: { option: 'u16' },
                max_close_ltv: { option: 'u16' },
                liquidation_fee: { option: 'u16' },
                oracle_id: { option: { array: { type: 'u8', len: 32 } } }
            }};
            return borsh.serialize(schema, value);
        };
        return new Transaction().add(new TransactionInstruction({
            keys: [
                {pubkey: this.#adminWallet, isSigner: true, isWritable: false},
                {pubkey: this.#bank, isSigner: false, isWritable: false},
                {pubkey: this.#asset, isSigner: false, isWritable: true},
                {pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false},
            ],
            programId: PROGRAM_ID_PUBKEY,
            data: this.getData(serializeArgs(this.#assetConfig))
        }));
    };
}
