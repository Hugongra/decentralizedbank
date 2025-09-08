import { PublicKey, SystemProgram, SYSVAR_CLOCK_PUBKEY, Transaction, TransactionInstruction } from "@solana/web3.js";
import * as borsh from 'borsh';
import { Buffer } from 'buffer';
import { XInstruction } from "../models/x-instruction";
import { CONNECTION, numberToBigint, PROGRAM_ID_PUBKEY, TOKEN_PROGRAM_ID } from "..";

export class BorrowState {
    
    readonly init: boolean = false;
    readonly pubKey: PublicKey;
    readonly version: number;
    readonly user: PublicKey;
    readonly asset: PublicKey;
    readonly amount: bigint;
    readonly borrowRateIndex: bigint;
    readonly deposit: PublicKey;
    readonly collateralAmount: bigint;

    static SCHEMA = { struct: {
        version: 'u8',
        last_update: {
            struct: {
                slot: 'u64',
                stale: 'bool',
            },
        },
        user: { array: { type: 'u8', len: 32 } },
        asset: { array: { type: 'u8', len: 32 } },
        amount: 'u64',
        borrow_rate_index: 'u64',
        deposit: { array: { type: 'u8', len: 32 } },
        collateral_amount: 'u64'
    }};

    constructor(pubKey: PublicKey, accountInfo?: any) {
        this.pubKey = pubKey;
        if (accountInfo) {
            const data = borsh.deserialize(BorrowState.SCHEMA, accountInfo.data.slice(8)) as any;
            this.version = data.version;
            this.user = new PublicKey(data.user);
            this.asset = new PublicKey(data.asset);
            this.amount = data.amount;
            this.borrowRateIndex = data.borrow_rate_index;
            this.deposit = new PublicKey(data.deposit);
            this.collateralAmount = data.collateral_amount;
            this.init = true;
        }
    }

    static fetchPublicKey(userWallet: PublicKey, borrowAsset: PublicKey, depositAsset: PublicKey): PublicKey {
        return PublicKey.findProgramAddressSync(
            [Buffer.from("borrow"), borrowAsset.toBuffer(), depositAsset.toBuffer(), userWallet.toBuffer()],
            PROGRAM_ID_PUBKEY
        )[0];
    }

    static async factory(userWallet: PublicKey, borrowAsset: PublicKey, depositAsset: PublicKey): Promise<BorrowState> {
        const pubKey = BorrowState.fetchPublicKey(userWallet, borrowAsset, depositAsset);
        const accountInfo = await CONNECTION.getAccountInfo(pubKey);
        return new BorrowState(pubKey, accountInfo);
    }

    static async from(pubKey: PublicKey): Promise<BorrowState> {
        const accountInfo = await CONNECTION.getAccountInfo(pubKey);
        return new BorrowState(pubKey, accountInfo);
    }

}

export class BorrowSolInstruction extends XInstruction {

    #userWalletPubKey: PublicKey;
    #bankPubKey: PublicKey;
    #borrowAssetPubKey: PublicKey;
    #depositAssetPubKey: PublicKey;
    #borrowPubKey: PublicKey;
    #depositPubKey: PublicKey;
    #reserveVaultPubkey: PublicKey;
    #collateralVaultPubkey: PublicKey;
    #depositVaultPubkey: PublicKey;
    #amount: bigint;

    // TODO: Remove after oracle integration
    #borrowPrice: number;
    #depositPrice: number;

    constructor(
        userWalletPubKey: PublicKey,
        bankPubKey: PublicKey,
        borrowAssetPubKey: PublicKey,
        depositAssetPubKey: PublicKey,
        borrowPubKey: PublicKey,
        depositPubKey: PublicKey,
        reserveVaultPubkey: PublicKey,
        collateralVaultPubkey: PublicKey,
        depositVaultPubkey: PublicKey,
        amount: bigint,
        borrowPrice: number,
        depositPrice: number) {
        super('global:borrow_sol');
        this.#userWalletPubKey = userWalletPubKey;
        this.#bankPubKey = bankPubKey;
        this.#borrowAssetPubKey = borrowAssetPubKey;
        this.#depositAssetPubKey = depositAssetPubKey;
        this.#borrowPubKey = borrowPubKey;
        this.#depositPubKey = depositPubKey;
        this.#reserveVaultPubkey = reserveVaultPubkey;
        this.#collateralVaultPubkey = collateralVaultPubkey;
        this.#depositVaultPubkey = depositVaultPubkey;
        this.#amount = amount;
        this.#borrowPrice = borrowPrice;
        this.#depositPrice = depositPrice;
    }

    getTransaction() {
        const serializeArgs = (amount: bigint, borrowPrice: number, depositAmount: number): Uint8Array => {
            const schema = { struct: {
                amount: 'u64',
                borrow_price: 'u64',
                deposit_price: 'u64',
            }};
            const value = {
                amount,
                borrow_price: numberToBigint(borrowPrice * 100, 2),
                deposit_price: numberToBigint(depositAmount * 100, 2),
            };
            return borsh.serialize(schema, value);
        }
        return new Transaction().add(new TransactionInstruction({
            keys: [
                {pubkey: this.#userWalletPubKey, isSigner: true, isWritable: true},
                {pubkey: this.#bankPubKey, isSigner: false, isWritable: false},
                {pubkey: this.#borrowAssetPubKey, isSigner: false, isWritable: true},
                {pubkey: this.#depositAssetPubKey, isSigner: false, isWritable: false},
                {pubkey: this.#borrowPubKey, isSigner: false, isWritable: true},
                {pubkey: this.#depositPubKey, isSigner: false, isWritable: false},
                {pubkey: this.#reserveVaultPubkey, isSigner: false, isWritable: true},
                {pubkey: this.#collateralVaultPubkey, isSigner: false, isWritable: true},
                {pubkey: this.#depositVaultPubkey, isSigner: false, isWritable: true},
                {pubkey: SystemProgram.programId, isSigner: false, isWritable: false},
                {pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false},
                {pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false},
            ],
            programId: this.programId,
            data: this.getData(serializeArgs(this.#amount, this.#borrowPrice, this.#depositPrice)),
        }));
    };
}

export class RepaySolInstruction extends XInstruction {

    #userWalletPubKey: PublicKey;
    #bankPubKey: PublicKey;
    #borrowAssetPubKey: PublicKey;
    #depositAssetPubKey: PublicKey;
    #borrowPubKey: PublicKey;
    #depositPubKey: PublicKey;
    #reserveVaultPubkey: PublicKey;
    #collateralVaultPubkey: PublicKey;
    #depositVaultPubkey: PublicKey;
    #feeVaultPubkey: PublicKey;
    #amount: bigint;

    constructor(
        userWalletPubKey: PublicKey,
        bankPubKey: PublicKey,
        borrowAssetPubKey: PublicKey,
        depositAssetPubKey: PublicKey,
        borrowPubKey: PublicKey,
        depositPubKey: PublicKey,
        reserveVaultPubkey: PublicKey,
        collateralVaultPubkey: PublicKey,
        depositVaultPubkey: PublicKey,
        feeVault: PublicKey,
        amount: bigint) {
        super('global:repay_sol');
        this.#userWalletPubKey = userWalletPubKey;
        this.#bankPubKey = bankPubKey;
        this.#borrowAssetPubKey = borrowAssetPubKey;
        this.#depositAssetPubKey = depositAssetPubKey;
        this.#borrowPubKey = borrowPubKey;
        this.#depositPubKey = depositPubKey;
        this.#reserveVaultPubkey = reserveVaultPubkey;
        this.#collateralVaultPubkey = collateralVaultPubkey;
        this.#depositVaultPubkey = depositVaultPubkey;
        this.#feeVaultPubkey = feeVault;
        this.#amount = amount;
    }

    getTransaction() {
        const serializeArgs = (amount: bigint): Uint8Array => {
            const schema = { struct: {
                amount: 'u64'
            }};
            const value = {
                amount
            };
            return borsh.serialize(schema, value);
        }
        return new Transaction().add(new TransactionInstruction({
            keys: [
                {pubkey: this.#userWalletPubKey, isSigner: true, isWritable: true},
                {pubkey: this.#bankPubKey, isSigner: false, isWritable: false},
                {pubkey: this.#borrowAssetPubKey, isSigner: false, isWritable: true},
                {pubkey: this.#depositAssetPubKey, isSigner: false, isWritable: false},
                {pubkey: this.#borrowPubKey, isSigner: false, isWritable: true},
                {pubkey: this.#depositPubKey, isSigner: false, isWritable: false},
                {pubkey: this.#reserveVaultPubkey, isSigner: false, isWritable: true},
                {pubkey: this.#collateralVaultPubkey, isSigner: false, isWritable: true},
                {pubkey: this.#depositVaultPubkey, isSigner: false, isWritable: true},
                {pubkey: this.#feeVaultPubkey, isSigner: false, isWritable: true},
                {pubkey: SystemProgram.programId, isSigner: false, isWritable: false},
                {pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false},
                {pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false},
            ],
            programId: this.programId,
            data: this.getData(serializeArgs(this.#amount)),
        }));
    };
}

export class BorrowTokenInstruction extends XInstruction {

    #userWalletPubKey: PublicKey;
    #bankPubKey: PublicKey;
    #borrowAssetPubKey: PublicKey;
    #depositAssetPubKey: PublicKey;
    #borrowPubKey: PublicKey;
    #depositPubKey: PublicKey;
    #reserveVaultPubkey: PublicKey;
    #collateralVaultPubkey: PublicKey;
    #depositVaultPubkey: PublicKey;
    #userReserveVaultPubkey: PublicKey;
    #amount: bigint;

    // TODO: Remove after oracle integration
    #borrowPrice: number;
    #depositPrice: number;

    constructor(
        userWalletPubKey: PublicKey,
        bankPubKey: PublicKey,
        borrowAssetPubKey: PublicKey,
        depositAssetPubKey: PublicKey,
        borrowPubKey: PublicKey,
        depositPubKey: PublicKey,
        reserveVaultPubkey: PublicKey,
        collateralVaultPubkey: PublicKey,
        depositVaultPubkey: PublicKey,
        userReserveVaultPubkey: PublicKey,
        amount: bigint,
        borrowPrice: number,
        depositPrice: number) {
        super('global:borrow_token');
        this.#userWalletPubKey = userWalletPubKey;
        this.#bankPubKey = bankPubKey;
        this.#borrowAssetPubKey = borrowAssetPubKey;
        this.#depositAssetPubKey = depositAssetPubKey;
        this.#borrowPubKey = borrowPubKey;
        this.#depositPubKey = depositPubKey;
        this.#reserveVaultPubkey = reserveVaultPubkey;
        this.#collateralVaultPubkey = collateralVaultPubkey;
        this.#depositVaultPubkey = depositVaultPubkey;
        this.#userReserveVaultPubkey = userReserveVaultPubkey;
        this.#amount = amount;
        this.#borrowPrice = borrowPrice;
        this.#depositPrice = depositPrice;
    }

    getTransaction() {
        const serializeArgs = (amount: bigint, borrowPrice: number, depositAmount: number): Uint8Array => {
            const schema = { struct: {
                amount: 'u64',
                borrow_price: 'u64',
                deposit_price: 'u64',
            }};
            const value = {
                amount,
                borrow_price: numberToBigint(borrowPrice * 100, 2),
                deposit_price: numberToBigint(depositAmount * 100, 2),
            };
            return borsh.serialize(schema, value);
        }
        return new Transaction().add(new TransactionInstruction({
            keys: [
                {pubkey: this.#userWalletPubKey, isSigner: true, isWritable: true},
                {pubkey: this.#bankPubKey, isSigner: false, isWritable: false},
                {pubkey: this.#borrowAssetPubKey, isSigner: false, isWritable: true},
                {pubkey: this.#depositAssetPubKey, isSigner: false, isWritable: false},
                {pubkey: this.#borrowPubKey, isSigner: false, isWritable: true},
                {pubkey: this.#depositPubKey, isSigner: false, isWritable: false},
                {pubkey: this.#reserveVaultPubkey, isSigner: false, isWritable: true},
                {pubkey: this.#collateralVaultPubkey, isSigner: false, isWritable: true},
                {pubkey: this.#depositVaultPubkey, isSigner: false, isWritable: true},
                {pubkey: this.#userReserveVaultPubkey, isSigner: false, isWritable: true},
                {pubkey: SystemProgram.programId, isSigner: false, isWritable: false},
                {pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false},
                {pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false},
            ],
            programId: this.programId,
            data: this.getData(serializeArgs(this.#amount, this.#borrowPrice, this.#depositPrice)),
        }));
    };
}

export class RepayTokenInstruction extends XInstruction {

    #userWalletPubKey: PublicKey;
    #bankPubKey: PublicKey;
    #borrowAssetPubKey: PublicKey;
    #depositAssetPubKey: PublicKey;
    #borrowPubKey: PublicKey;
    #depositPubKey: PublicKey;
    #reserveVaultPubkey: PublicKey;
    #collateralVaultPubkey: PublicKey;
    #depositVaultPubkey: PublicKey;
    #userReserveVaultPubkey: PublicKey;
    #feeVaultPubkey: PublicKey;
    #amount: bigint;

    constructor(
        userWalletPubKey: PublicKey,
        bankPubKey: PublicKey,
        borrowAssetPubKey: PublicKey,
        depositAssetPubKey: PublicKey,
        borrowPubKey: PublicKey,
        depositPubKey: PublicKey,
        reserveVaultPubkey: PublicKey,
        collateralVaultPubkey: PublicKey,
        depositVaultPubkey: PublicKey,
        userReserveVaultPubkey: PublicKey,
        feeVaultPubkey: PublicKey,
        amount: bigint) {
        super('global:repay_token');
        this.#userWalletPubKey = userWalletPubKey;
        this.#bankPubKey = bankPubKey;
        this.#borrowAssetPubKey = borrowAssetPubKey;
        this.#depositAssetPubKey = depositAssetPubKey;
        this.#borrowPubKey = borrowPubKey;
        this.#depositPubKey = depositPubKey;
        this.#reserveVaultPubkey = reserveVaultPubkey;
        this.#collateralVaultPubkey = collateralVaultPubkey;
        this.#depositVaultPubkey = depositVaultPubkey;
        this.#userReserveVaultPubkey = userReserveVaultPubkey;
        this.#feeVaultPubkey = feeVaultPubkey;
        this.#amount = amount;
    }

    getTransaction() {
        const serializeArgs = (amount: bigint): Uint8Array => {
            const schema = { struct: {
                amount: 'u64'
            }};
            const value = {
                amount
            };
            return borsh.serialize(schema, value);
        }
        return new Transaction().add(new TransactionInstruction({
            keys: [
                {pubkey: this.#userWalletPubKey, isSigner: true, isWritable: true},
                {pubkey: this.#bankPubKey, isSigner: false, isWritable: false},
                {pubkey: this.#borrowAssetPubKey, isSigner: false, isWritable: true},
                {pubkey: this.#depositAssetPubKey, isSigner: false, isWritable: false},
                {pubkey: this.#borrowPubKey, isSigner: false, isWritable: true},
                {pubkey: this.#depositPubKey, isSigner: false, isWritable: false},
                {pubkey: this.#reserveVaultPubkey, isSigner: false, isWritable: true},
                {pubkey: this.#collateralVaultPubkey, isSigner: false, isWritable: true},
                {pubkey: this.#depositVaultPubkey, isSigner: false, isWritable: true},
                {pubkey: this.#userReserveVaultPubkey, isSigner: false, isWritable: true},
                {pubkey: this.#feeVaultPubkey, isSigner: false, isWritable: true},
                {pubkey: SystemProgram.programId, isSigner: false, isWritable: false},
                {pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false},
                {pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false},
            ],
            programId: this.programId,
            data: this.getData(serializeArgs(this.#amount)),
        }));
    };
}
