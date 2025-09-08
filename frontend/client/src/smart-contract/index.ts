import { Connection, PublicKey } from "@solana/web3.js";
import { BANK_ADDRESS, BLOCKCHAIN_URL, PROGRAM_ID } from "../environments/env";
import { Decimal } from 'decimal.js';

// -----------------------------------------------------------------------------------------------------
// CONSTANTS
// -----------------------------------------------------------------------------------------------------

export const CONNECTION = new Connection(BLOCKCHAIN_URL, 'confirmed');
export const PROGRAM_ID_PUBKEY = new PublicKey(PROGRAM_ID);
export const BANK_PUBKEY = new PublicKey(BANK_ADDRESS);

export const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
export const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');

// -----------------------------------------------------------------------------------------------------
// FUNCTIONS
// -----------------------------------------------------------------------------------------------------

export function bpsToPercent(value: number): number {
    return value/100;
}

export function bigintToNumber(value: bigint, decimals: number = 15): number {
    const dividend = new Decimal(value.toString());
    const divisor = Decimal.pow(10, decimals);
    const result = dividend.div(divisor);
    return Number(result);
}

export function numberToBigint(number: number, decimals: number = 18): bigint {
    const result = new Decimal(number).mul(new Decimal(10).pow(decimals));
    return BigInt(result.toFixed(0));
}
