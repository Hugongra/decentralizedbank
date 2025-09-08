import * as borsh from 'borsh';
import { PublicKey } from '@solana/web3.js';
import { CONNECTION } from '..';

export class BankState {
    
    readonly init: boolean = false;
    readonly pubkey: PublicKey;
    readonly version: number;
    readonly bumpSeed: number;
    readonly admin: PublicKey;
    readonly liquidator: PublicKey;
    readonly feeVault: PublicKey;
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
            this.feeVault = new PublicKey(data.fee_vault);
            this.defcon = data.defcon;
            this.init = true;
        }
    }

    static async from(pubKey: PublicKey): Promise<BankState> {
        const accountInfo = await CONNECTION.getAccountInfo(pubKey);
        return new BankState(pubKey, accountInfo);
    }

}
