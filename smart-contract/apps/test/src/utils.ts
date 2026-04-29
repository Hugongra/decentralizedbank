import { Account, getAccount, getAssociatedTokenAddress } from "@solana/spl-token";
import * as fs from 'fs';
import * as path from 'path';
import { PublicKey } from "@solana/web3.js";
import { TokenAccount } from "./models/token_account";
import { CONNECTION } from "./config";
import { BN } from "@coral-xyz/anchor";
import { LOGS_PATH } from "./config";

export function bytesToString(byteArray: number[]): string {
    const uint8Array = new Uint8Array(byteArray);
    const decodedString = new TextDecoder("utf-8").decode(uint8Array);
    return decodedString.replace(/\0/g, "");
}

export async function fetchTokenAccount(authority: PublicKey, pda = true, mint?: PublicKey, mintDecimals: number = 9): Promise<TokenAccount> {
    async function fetchTokenAccountLamports(tokenAccountPubkey: PublicKey) {
        try {
            // Fetch the token account information and decode it
            const tokenAccount: Account = await getAccount(CONNECTION, tokenAccountPubkey);
    
            // Get the raw balance in base units (smallest denomination, e.g., lamports for tokens)
            const amount = tokenAccount.amount;
    
            return new BN(amount.toString());
        } catch (error) {
            console.error("Failed to fetch token balance:", error);
            throw error;
        }
    }
    const pubKey = await getAssociatedTokenAddress(
        mint,
        authority,
        pda // True if authority is a PDA
    );
    const accountInfo = await CONNECTION.getAccountInfo(pubKey);
    if (accountInfo) {
        const lamports = await fetchTokenAccountLamports(pubKey);
        return new TokenAccount(pubKey, true, lamports, mint, mintDecimals);
    }
    return new TokenAccount(pubKey, false);
};

export enum Method {
    CREATE_BANK = 'CreateBank',
    CREATE_ASSET = 'CreateAsset',
    CREATE_DEPOSIT = 'CreateDeposit',
    DEPOSIT_SOL = 'DepositSol',
    DEPOSIT_TOKEN = 'DepositToken',
    WITHDRAW_SOL = 'WithdrawSol',
    WITHDRAW_TOKEN = 'WithdrawToken',
    BORROW_SOL = 'BorrowSol',
    BORROW_TOKEN = 'BorrowToken',
    REPAY_SOL = 'RepaySol',
    REPAY_TOKEN = 'RepayToken',
}

export enum TAG {
    BANK = 'Bank',
    ASSET = 'Asset',
    DEPOSIT_ASSET = 'DepositAsset',
    BORROW_ASSET = 'BorrowAsset',
    DEPOSIT = 'Deposit',
    BORROW = 'Borrow',
    RESERVE_VAULT = 'ReserveVault',
    COLLATERAL_VAULT = 'CollateralVault',
    DEPOSIT_VAULT = 'DepositVault',
    USER_RESERVE_VAULT = 'UserReserve',
    FEE_VAULT = 'FeeVault',
    AMOUNT = 'Amount',
    BORROW_PRICE = 'BorrowPrice',
    DEPOSIT_PRICE = 'DepositPrice'
}

export function createLog(
    signature: string,
    method: Method,
    accounts: {name: TAG, account: any}[],
    logs: any,
    args: {name: TAG, value: any}[] = []) {
    const uuid = crypto.randomUUID();
    const timestamp = new Date(Date.now()).toISOString();
    const data = {
        method,
        metadata: {
            uuid,
            signature,
            timestamp,
            error: Boolean(!signature)
        },
        accounts,
        args,
        logs
    };
    const log = `${timestamp}   ${Boolean(!signature) ? 'ERROR' : 'SUCCESS'}  ${method}   ${uuid}\n`;
    console.log(log);
    fs.writeFileSync(path.join(LOGS_PATH, 'data', `${uuid}.json`), JSON.stringify(data, null, 2), "utf-8");
    fs.appendFileSync(path.join(LOGS_PATH, `history.txt`), log, 'utf8');
}