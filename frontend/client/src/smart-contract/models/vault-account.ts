import { PublicKey } from "@solana/web3.js";
import * as borsh from 'borsh';
import { ASSOCIATED_TOKEN_PROGRAM_ID, CONNECTION, TOKEN_PROGRAM_ID } from "..";

export class VaultAccount {

    readonly init: boolean = false;

    readonly mint: PublicKey;
    
    readonly pubKey: PublicKey;

    readonly amount: bigint;

    constructor(init: boolean, pubKey: PublicKey, mint: PublicKey, amount: bigint) {
        this.init = init;
        this.mint = mint;
        this.pubKey = pubKey;
        this.amount = amount;
    }

}

export class SystemAccount extends VaultAccount {

    constructor(pubKey: PublicKey, accountInfo: any) {
        super(!!accountInfo, pubKey, PublicKey.default, BigInt(accountInfo.lamports));
    }

    static async from(pubKey: PublicKey): Promise<TokenAccount> {
        const accountInfo = await CONNECTION.getAccountInfo(pubKey);
        return new SystemAccount(pubKey, accountInfo);
    }

};

export class TokenAccount extends VaultAccount {

    constructor(pubKey: PublicKey, accountInfo: any, mint: PublicKey) {
        let data;
        if (accountInfo) {
            data = borsh.deserialize(TokenAccount.SCHEMA, accountInfo.data) as any;
        }
        super(!!accountInfo, pubKey, mint, data?.amount);
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

    static async from(pubKey: PublicKey, mint: PublicKey): Promise<TokenAccount> {
        const accountInfo = await CONNECTION.getAccountInfo(pubKey);
        return new TokenAccount(pubKey, accountInfo, mint);
    }

    static async factory(authority: PublicKey, mint: PublicKey): Promise<TokenAccount> {
        const pubKey = TokenAccount.fetchPublicKey(authority, mint);
        return await TokenAccount.from(pubKey, mint);
    }

};
