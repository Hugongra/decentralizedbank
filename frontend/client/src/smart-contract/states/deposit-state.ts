import { PublicKey, SystemProgram, SYSVAR_CLOCK_PUBKEY, Transaction, TransactionInstruction } from "@solana/web3.js";
import * as borsh from 'borsh';
import { Buffer } from 'buffer';
import { XInstruction } from "../models/x-instruction";
import { ASSOCIATED_TOKEN_PROGRAM_ID, CONNECTION, PROGRAM_ID_PUBKEY, TOKEN_PROGRAM_ID } from "..";
import { AssetState } from "./asset-state";
import { TokenAccount } from "../models/vault-account";

export class DepositState {
    
    readonly init: boolean = false;
    readonly pubKey: PublicKey;
    readonly user: PublicKey;
    readonly asset: PublicKey;
    readonly amount: bigint;
    readonly depositRateIndex: bigint;

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
        deposit_rate_index: 'u64',
    }}

    constructor(pubKey: PublicKey, accountInfo: any) {
        this.pubKey = pubKey;
        if (accountInfo) {
            this.init = true;
            const data = borsh.deserialize(DepositState.SCHEMA, accountInfo.data.slice(8)) as any;
            this.user = new PublicKey(data.user);
            this.asset = new PublicKey(data.asset);
            this.amount = data.amount;
            this.depositRateIndex = data.deposit_rate_index;
        }
    }

    static fetchPubKey(assetPubKey: PublicKey, userWalletPubKey: PublicKey): PublicKey {
        return PublicKey.findProgramAddressSync(
            [Buffer.from("deposit"), assetPubKey.toBuffer(), userWalletPubKey.toBuffer()],
            PROGRAM_ID_PUBKEY
        )[0];
    }

    static async from(publicKey: PublicKey): Promise<DepositState> {
        const accountInfo = await CONNECTION.getAccountInfo(publicKey);
        return new DepositState(publicKey, accountInfo);
    }

    static async factory(assetPublicKey: PublicKey, userWalletPublicKey: PublicKey): Promise<DepositState> {
        const pubKey = DepositState.fetchPubKey(assetPublicKey, userWalletPublicKey);
        const accountInfo = await CONNECTION.getAccountInfo(pubKey);
        return new DepositState(pubKey, accountInfo);
    }

}

export class CreateDepositInstruction extends XInstruction {

    #userWalletPubKey: PublicKey;
    #representativeMintPubKey: PublicKey;
    #bankPubKey: PublicKey;
    #assetPubKey: PublicKey;
    
    constructor(
        userWalletPubKey: PublicKey,
        representativeMintPubKey: PublicKey,
        bankPubKey: PublicKey,
        assetPubKey: PublicKey) {
        super('global:create_deposit');
        this.#userWalletPubKey = userWalletPubKey;
        this.#representativeMintPubKey = representativeMintPubKey;
        this.#bankPubKey = bankPubKey;
        this.#assetPubKey = assetPubKey;
    }

    getTransaction() {
        const depositPubKey = DepositState.fetchPubKey(this.#assetPubKey, this.#userWalletPubKey);
        const depositVaultPublicKey = TokenAccount.fetchPublicKey(this.#userWalletPubKey, this.#representativeMintPubKey);
        return new Transaction().add(new TransactionInstruction({
            keys: [
                {pubkey: this.#userWalletPubKey, isSigner: true, isWritable: true},
                {pubkey: this.#representativeMintPubKey, isSigner: false, isWritable: false},
                {pubkey: this.#bankPubKey, isSigner: false, isWritable: false},
                {pubkey: this.#assetPubKey, isSigner: false, isWritable: false},
                {pubkey: depositPubKey, isSigner: false, isWritable: true},
                {pubkey: depositVaultPublicKey, isSigner: false, isWritable: true},
                {pubkey: SystemProgram.programId, isSigner: false, isWritable: false},
                {pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false},
                {pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false},
                {pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false},
            ],
            programId: this.programId,
            data: this.getData(),
        }));
    };
}

export class DepositSolInstruction extends XInstruction {

    #userWalletPubKey: PublicKey;
    #mintPubKey: PublicKey;
    #representativeMintPubKey: PublicKey;
    #bankPubKey: PublicKey;
    #assetPubKey: PublicKey;
    #depositPubKey: PublicKey;
    #amount: bigint;
    
    constructor(
        userWalletPubKey: PublicKey,
        mintPubKey: PublicKey,
        representativeMintPubKey: PublicKey,
        bankPubKey: PublicKey,
        assetPubKey: PublicKey,
        depositPubKey: PublicKey,
        amount: bigint) {
        super('global:deposit_sol');
        this.#userWalletPubKey = userWalletPubKey;
        this.#mintPubKey = mintPubKey;
        this.#representativeMintPubKey = representativeMintPubKey;
        this.#bankPubKey = bankPubKey;
        this.#assetPubKey = assetPubKey;
        this.#depositPubKey = depositPubKey;
        this.#amount = amount;
    }

    getTransaction() {
        const serializeArgs = (amount: bigint): Uint8Array => {
            const schema = { struct: {
                amount: 'u64',
            }};
            const value = {
                amount,
            };
            return borsh.serialize(schema, value);
        }
        const reserveVaultPubkey = AssetState.fetchReserveVaultPublicKey(this.#bankPubKey, this.#mintPubKey);
        const depositVaultPubkey = TokenAccount.fetchPublicKey(this.#userWalletPubKey, this.#representativeMintPubKey);
        return new Transaction().add(new TransactionInstruction({
            keys: [
                {pubkey: this.#userWalletPubKey, isSigner: true, isWritable: true},
                {pubkey: this.#representativeMintPubKey, isSigner: false, isWritable: true},
                {pubkey: this.#bankPubKey, isSigner: false, isWritable: false},
                {pubkey: this.#assetPubKey, isSigner: false, isWritable: true},
                {pubkey: this.#depositPubKey, isSigner: false, isWritable: true},
                {pubkey: reserveVaultPubkey, isSigner: false, isWritable: true},
                {pubkey: depositVaultPubkey, isSigner: false, isWritable: true},
                {pubkey: SystemProgram.programId, isSigner: false, isWritable: false},
                {pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false},
                {pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false},
                {pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false},
            ],
            programId: this.programId,
            data: this.getData(serializeArgs(this.#amount)),
        }));
    };
}

export class WithdrawSolInstruction extends XInstruction {

    #userWalletPubKey: PublicKey;
    #mintPubKey: PublicKey;
    #representativeMintPubKey: PublicKey;
    #bankPubKey: PublicKey;
    #assetPubKey: PublicKey;
    #depositPubKey: PublicKey;
    #amount: bigint;
    
    constructor(
        userWalletPubKey: PublicKey,
        mintPubKey: PublicKey,
        representativeMintPubKey: PublicKey,
        bankPubKey: PublicKey,
        assetPubKey: PublicKey,
        depositPubKey: PublicKey,
        amount: bigint) {
        super('global:withdraw_sol');
        this.#userWalletPubKey = userWalletPubKey;
        this.#mintPubKey = mintPubKey;
        this.#representativeMintPubKey = representativeMintPubKey;
        this.#bankPubKey = bankPubKey;
        this.#assetPubKey = assetPubKey;
        this.#depositPubKey = depositPubKey;
        this.#amount = amount;
    }

    getTransaction() {
        const serializeArgs = (amount: bigint): Uint8Array => {
            const schema = { struct: {
                amount: 'u64',
            }};
            const value = {
                amount,
            };
            return borsh.serialize(schema, value);
        }
        const reserveVaultPubKey = AssetState.fetchReserveVaultPublicKey(this.#bankPubKey, this.#mintPubKey);
        const depositVaultPubKey = TokenAccount.fetchPublicKey(this.#userWalletPubKey, this.#representativeMintPubKey);
        return new Transaction().add(new TransactionInstruction({
            keys: [
                {pubkey: this.#userWalletPubKey, isSigner: true, isWritable: true},
                {pubkey: this.#representativeMintPubKey, isSigner: false, isWritable: true},
                {pubkey: this.#bankPubKey, isSigner: false, isWritable: false},
                {pubkey: this.#assetPubKey, isSigner: false, isWritable: true},
                {pubkey: this.#depositPubKey, isSigner: false, isWritable: true},
                {pubkey: reserveVaultPubKey, isSigner: false, isWritable: true},
                {pubkey: depositVaultPubKey, isSigner: false, isWritable: true},
                {pubkey: SystemProgram.programId, isSigner: false, isWritable: false},
                {pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false},
                {pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false},
                {pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false},
            ],
            programId: this.programId,
            data: this.getData(serializeArgs(this.#amount)),
        }));
    };
}

export class DepositTokenInstruction extends XInstruction {

    #userWalletPubKey: PublicKey;
    #mintPubKey: PublicKey;
    #representativeMintPubKey: PublicKey;
    #bankPubKey: PublicKey;
    #assetPubKey: PublicKey;
    #depositPubKey: PublicKey;
    #amount: bigint;
    
    constructor(
        userWalletPubKey: PublicKey,
        mintPubKey: PublicKey,
        representativeMintPubKey: PublicKey,
        bankPubKey: PublicKey,
        assetPubKey: PublicKey,
        depositPubKey: PublicKey,
        amount: bigint) {
        super('global:deposit_token');
        this.#userWalletPubKey = userWalletPubKey;
        this.#mintPubKey = mintPubKey;
        this.#representativeMintPubKey = representativeMintPubKey;
        this.#bankPubKey = bankPubKey;
        this.#assetPubKey = assetPubKey;
        this.#depositPubKey = depositPubKey;
        this.#amount = amount;
    }

    getTransaction() {
        const serializeArgs = (amount: bigint): Uint8Array => {
            const schema = { struct: {
                amount: 'u64',
            }};
            const value = {
                amount,
            };
            return borsh.serialize(schema, value);
        }
        const reserveVaultPubkey = AssetState.fetchReserveVaultPublicKey(this.#bankPubKey, this.#mintPubKey);
        const depositVaultPubkey = TokenAccount.fetchPublicKey(this.#userWalletPubKey, this.#representativeMintPubKey);
        const userReserveVaultPubkey = TokenAccount.fetchPublicKey(this.#userWalletPubKey, this.#mintPubKey);
        return new Transaction().add(new TransactionInstruction({
            keys: [
                {pubkey: this.#userWalletPubKey, isSigner: true, isWritable: true},
                {pubkey: this.#mintPubKey, isSigner: false, isWritable: false},
                {pubkey: this.#representativeMintPubKey, isSigner: false, isWritable: true},
                {pubkey: this.#bankPubKey, isSigner: false, isWritable: false},
                {pubkey: this.#assetPubKey, isSigner: false, isWritable: true},
                {pubkey: this.#depositPubKey, isSigner: false, isWritable: true},
                {pubkey: reserveVaultPubkey, isSigner: false, isWritable: true},
                {pubkey: depositVaultPubkey, isSigner: false, isWritable: true},
                {pubkey: userReserveVaultPubkey, isSigner: false, isWritable: true},
                {pubkey: SystemProgram.programId, isSigner: false, isWritable: false},
                {pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false},
                {pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false},
                {pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false},
            ],
            programId: this.programId,
            data: this.getData(serializeArgs(this.#amount)),
        }));
    };
}

export class WithdrawTokenInstruction extends XInstruction {

    #userWalletPubKey: PublicKey;
    #mintPubKey: PublicKey;
    #representativeMintPubKey: PublicKey;
    #bankPubKey: PublicKey;
    #assetPubKey: PublicKey;
    #depositPubKey: PublicKey;
    #amount: bigint;
    
    constructor(
        userWalletPubKey: PublicKey,
        mintPubKey: PublicKey,
        representativeMintPubKey: PublicKey,
        bankPubKey: PublicKey,
        assetPubKey: PublicKey,
        depositPubKey: PublicKey,
        amount: bigint) {
        super('global:withdraw_token');
        this.#userWalletPubKey = userWalletPubKey;
        this.#mintPubKey = mintPubKey;
        this.#representativeMintPubKey = representativeMintPubKey;
        this.#bankPubKey = bankPubKey;
        this.#assetPubKey = assetPubKey;
        this.#depositPubKey = depositPubKey;
        this.#amount = amount;
    }

    getTransaction() {
        const serializeArgs = (amount: bigint): Uint8Array => {
            const schema = { struct: {
                amount: 'u64',
            }};
            const value = {
                amount,
            };
            return borsh.serialize(schema, value);
        }
        const reserveVaultPubkey = AssetState.fetchReserveVaultPublicKey(this.#bankPubKey, this.#mintPubKey);
        const depositVaultPubkey = TokenAccount.fetchPublicKey(this.#userWalletPubKey, this.#representativeMintPubKey);
        const userReserveVaultPubkey = TokenAccount.fetchPublicKey(this.#userWalletPubKey, this.#mintPubKey);
        return new Transaction().add(new TransactionInstruction({
            keys: [
                {pubkey: this.#userWalletPubKey, isSigner: true, isWritable: true},
                {pubkey: this.#mintPubKey, isSigner: false, isWritable: false},
                {pubkey: this.#representativeMintPubKey, isSigner: false, isWritable: true},
                {pubkey: this.#bankPubKey, isSigner: false, isWritable: false},
                {pubkey: this.#assetPubKey, isSigner: false, isWritable: true},
                {pubkey: this.#depositPubKey, isSigner: false, isWritable: true},
                {pubkey: reserveVaultPubkey, isSigner: false, isWritable: true},
                {pubkey: depositVaultPubkey, isSigner: false, isWritable: true},
                {pubkey: userReserveVaultPubkey, isSigner: false, isWritable: true},
                {pubkey: SystemProgram.programId, isSigner: false, isWritable: false},
                {pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false},
                {pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false},
                {pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false},
            ],
            programId: this.programId,
            data: this.getData(serializeArgs(this.#amount)),
        }));
    };
}
