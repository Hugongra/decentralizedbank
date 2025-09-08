import * as borsh from 'borsh';
import { Buffer } from 'buffer';
import { PublicKey, SystemProgram, Transaction, TransactionInstruction } from '@solana/web3.js';
import { PROGRAM_ID } from '../../environments/env';
import { XInstruction } from '../pojos/x-instruction';
import { CONNECTION, PROGRAM_ID_PUBKEY } from '..';

export class BankState {
    
    readonly init: boolean = false;
    readonly pubkey: PublicKey;
    readonly version: number;
    readonly bumpSeed: number;
    readonly admin: PublicKey;
    readonly liquidator: PublicKey;
    readonly fee_vault: PublicKey;
    readonly defcon: number;

    static SCHEMA = { struct: {
        version: 'u8',
        bump_seed: 'u8',
        admin: { array: { type: 'u8', len: 32 } },
        liquidator: { array: { type: 'u8', len: 32 } },
        fee_vault: { array: { type: 'u8', len: 32 } },
        defcon: 'u8'
    }};
    
    constructor(pubkey: PublicKey, accountInfo: any) {
        this.pubkey = pubkey;
        if (accountInfo !== null) {
            const data = borsh.deserialize(BankState.SCHEMA, accountInfo.data.slice(8)) as any;
            this.version = data.version;
            this.bumpSeed = data.bump_seed;
            this.admin = new PublicKey(data.admin);
            this.liquidator = new PublicKey(data.liquidator);
            this.fee_vault = new PublicKey(data.fee_vault);
            this.defcon = data.defcon;
            this.init = true;
        }
    }

    get pubkeyBase58() {
        return this.pubkey.toBase58();
    }

    get adminBase58() {
        return this.admin.toBase58();
    }

    get liquidatorBase58() {
        return this.liquidator.toBase58();
    }

    get feeVaultBase58() {
        return this.fee_vault.toBase58();
    }

    static fetchPublicKey(adminWallet: PublicKey): PublicKey {
        return PublicKey.findProgramAddressSync(
            [Buffer.from("bank"), adminWallet.toBuffer()],
            new PublicKey(PROGRAM_ID)
        )[0];
    }

    static async factory(adminWallet: PublicKey): Promise<BankState> {
        const pubKey = BankState.fetchPublicKey(adminWallet);
        const accountInfo = await CONNECTION.getAccountInfo(pubKey);
        return new BankState(pubKey, accountInfo);
    }

}

export class CreateBankInstruction extends XInstruction {
    
    #adminWallet: PublicKey;
    #bank: PublicKey;
    #liquidator: PublicKey;
    #feeVault: PublicKey;
    
    constructor(
        adminWallet: PublicKey,
        bank: PublicKey,
        liquidator: PublicKey,
        feeVault: PublicKey) {
        super('global:create_bank');
        this.#adminWallet = adminWallet
        this.#bank = bank;
        this.#liquidator = liquidator;
        this.#feeVault = feeVault;
    }

    getTransaction() {
        return new Transaction().add(new TransactionInstruction({
            keys: [
                {pubkey: this.#adminWallet, isSigner: true, isWritable: false},
                {pubkey: this.#bank, isSigner: false, isWritable: true},
                {pubkey: this.#liquidator, isSigner: false, isWritable: false},
                {pubkey: this.#feeVault, isSigner: false, isWritable: false},
                {pubkey: SystemProgram.programId, isSigner: false, isWritable: false}
            ],
            programId: PROGRAM_ID_PUBKEY,
            data: this.getData()
        }));
    };

}


export class UpdateBankInstruction extends XInstruction {
    
    #adminWallet: PublicKey;
    #bank: PublicKey;
    
    #liquidator?: PublicKey;
    #feeVault?: PublicKey;
    #resetDefcon?: boolean;
    
    constructor(
        adminWallet: PublicKey,
        bank: PublicKey,
        liquidator?: PublicKey,
        feeVault?: PublicKey,
        resetDefcon?: boolean) {
        super('global:update_bank');
        this.#adminWallet = adminWallet
        this.#bank = bank;
        this.#liquidator = liquidator;
        this.#feeVault = feeVault;
        this.#resetDefcon = resetDefcon;
    }

    getTransaction() {
        const args = (liquidator?: PublicKey, feeVault?: PublicKey, resetDefcon?: boolean): Uint8Array => {
            const value = {
                liquidator: liquidator ? liquidator.toBuffer() : null,
                fee_vault: feeVault ? feeVault.toBuffer() : null,
                reset_defcon: resetDefcon === undefined ? null : resetDefcon
            };
            const schema = { struct: {
                liquidator: { option: { array: { type: 'u8', len: 32 } }},
                fee_vault: { option: { array: { type: 'u8', len: 32 } }},
                reset_defcon: { option: 'bool' }
            }};
            return borsh.serialize(schema, value);
        };
        return new Transaction().add(new TransactionInstruction({
            keys: [
                {pubkey: this.#adminWallet, isSigner: true, isWritable: false},
                {pubkey: this.#bank, isSigner: false, isWritable: true},
                {pubkey: SystemProgram.programId, isSigner: false, isWritable: false},
            ],
            programId: PROGRAM_ID_PUBKEY,
            data: this.getData(args(this.#liquidator, this.#feeVault, this.#resetDefcon))
        }));
    };

}
