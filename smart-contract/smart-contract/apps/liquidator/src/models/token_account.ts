import { PublicKey } from "@solana/web3.js";
import { XAccount } from "./account";
import { BN } from '@coral-xyz/anchor';
import { getAccount, getAssociatedTokenAddress } from "@solana/spl-token";
import { CONNECTION } from "../config";

export class TokenAccount extends XAccount {

    lamports: BN;
    mint: PublicKey;
    mintDecimals: number;
    
    constructor(pubKey: PublicKey, init: boolean, lamports?: BN, mint?: PublicKey, mintDecimals?: number) {
        super(pubKey, init);
        this.lamports = lamports;
        this.mint = mint;
        this.mintDecimals = mintDecimals;
    }

    static async pubKeyFactory(ownerPublicKey: PublicKey, pda = true, mintPublicKey?: PublicKey): Promise<PublicKey> {
        return await getAssociatedTokenAddress(mintPublicKey, ownerPublicKey, pda);
    }

    static async from(publicKey: PublicKey,  mintPublicKey: PublicKey, mintDecimals: number): Promise<TokenAccount> {
        const accountInfo = await CONNECTION.getAccountInfo(publicKey);
        if (accountInfo) {
            const tokenAccout = await getAccount(CONNECTION, publicKey);
            const lamports = new BN(tokenAccout.amount.toString());
            return new TokenAccount(publicKey, true, lamports, mintPublicKey, mintDecimals);
        } else {
            return new TokenAccount(publicKey, false, new BN(0), mintPublicKey, mintDecimals);
        }
    }

    static async factory(ownerPublicKey: PublicKey, pda = true, mintPublicKey?: PublicKey, mintDecimals = 9): Promise<TokenAccount> {
        const publicKey = await TokenAccount.pubKeyFactory(ownerPublicKey, pda, mintPublicKey);
        return await TokenAccount.from(publicKey, mintPublicKey, mintDecimals);
    }

    get amount(): number {
        return this.lamports.div(new BN(10).pow(new BN(this.mintDecimals))).toNumber();
    }

    json() {
        return {
            lamports: this.lamports?.toString(),
            mint: this.mint?.toString(),
            mintDecimals: this.mintDecimals
        };
    }

}
