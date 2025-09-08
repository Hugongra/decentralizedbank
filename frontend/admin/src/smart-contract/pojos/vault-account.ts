import { PublicKey } from "@solana/web3.js";
import * as borsh from 'borsh';
import { ASSOCIATED_TOKEN_PROGRAM_ID, CONNECTION, TOKEN_PROGRAM_ID } from "..";

export class VaultAccount {
    
    readonly pubKey: PublicKey;

    readonly amount: bigint;

    constructor(pubKey: PublicKey, amount: bigint) {
        this.pubKey = pubKey;
        this.amount = amount;
    }

}

export class SystemAccount extends VaultAccount {

    constructor(pubKey: PublicKey, accountInfo: any) {
        super(pubKey, accountInfo.lamports);
    }

    static async from(pubKey: PublicKey): Promise<TokenAccount> {
        const accountInfo = await CONNECTION.getAccountInfo(pubKey);
        return new SystemAccount(pubKey, accountInfo);
    }

};

export class TokenAccount extends VaultAccount {

    constructor(pubKey: PublicKey, accountInfo: any) {
        const data = borsh.deserialize(TokenAccount.SCHEMA, accountInfo.data) as any;
        super(pubKey, data.amount);
    }

    static SCHEMA = { struct: {
        mint: { array: { type: 'u8', len: 32 } },
        owner: { array: { type: 'u8', len: 32 } },
        amount: 'u64',
        delegateOption: 'u32',
        delegate: { array: { type: 'u8', len: 32 } },
        state: 'u8',
        isNativeOption: 'u32',
        isNative: 'u64',
        delegatedAmount: 'u64',
        closeAuthorityOption: 'u32',
        closeAuthority: { array: { type: 'u8', len: 32 } },
    }};

    static fetchPublicKey(authority: PublicKey, mint: PublicKey): PublicKey {
        return PublicKey.findProgramAddressSync(
            [authority.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
            ASSOCIATED_TOKEN_PROGRAM_ID,
        )[0];
    }

    static async factory(authority: PublicKey, mint: PublicKey): Promise<TokenAccount> {
        const pubKey = TokenAccount.fetchPublicKey(authority, mint);
        const accountInfo = await CONNECTION.getAccountInfo(pubKey);
        return new TokenAccount(pubKey, accountInfo);
    }
    
    static async from(pubKey: PublicKey): Promise<TokenAccount> {
        const accountInfo = await CONNECTION.getAccountInfo(pubKey);
        return new TokenAccount(pubKey, accountInfo);
    }

};
