import { Connection, PublicKey } from "@solana/web3.js";
import { BLOCKCHAIN_URL, PROGRAM_ID } from "../environments/env";

// -----------------------------------------------------------------------------------------------------
// CONSTANTS
// -----------------------------------------------------------------------------------------------------

export const CONNECTION = new Connection(BLOCKCHAIN_URL, 'confirmed');
export const PROGRAM_ID_PUBKEY = new PublicKey(PROGRAM_ID);

export const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
export const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');

export const BPS = 10000;

// -----------------------------------------------------------------------------------------------------
// FUNCTIONS
// -----------------------------------------------------------------------------------------------------

export function bpsToPercent(value: number): number {
    return value/100;
}

export function percentToBps(value: number): number {
    return value * 100;
}

export function bigintToNumber(value: bigint, decimals: number = 18): number {
    const divisor = BigInt(10) ** BigInt(decimals);
    const result = value / divisor;
    const remainder = value % divisor;
    if (result > Number.MAX_SAFE_INTEGER) {
        throw new Error("Result exceeds JavaScript safe number range. Use BigInt or string.");
    }
    return Number(result);
}