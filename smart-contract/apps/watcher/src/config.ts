import * as web3 from '@solana/web3.js'
import * as anchor from '@coral-xyz/anchor';
import fs from 'fs';
import path from 'path';
import * as dotenv from 'dotenv';
import { GetBank } from './get_bank';
import { bs58 } from '@coral-xyz/anchor/dist/cjs/utils/bytes';

dotenv.config();

// Base
export const DELAY = parseInt(process.env.DELAY || '10000');

// Wallets
export const LIQUIDATOR_WALLET = web3.Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', '..', 'test', 'wallets', 'admin-wallet.json'), 'utf-8'))));

// Smart Contract
const IDL = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', '..', '..', 'target', 'idl', 'get_bank.json'), 'utf8'));
export const CONNECTION = new web3.Connection(process.env.BLOCKCHAIN_URL, 'confirmed');
const provider = new anchor.AnchorProvider(CONNECTION, new anchor.Wallet(LIQUIDATOR_WALLET), { commitment: "confirmed" });
export const PROGRAM = new anchor.Program<GetBank>(IDL, provider);

// API
export const API_URL = process.env.API_URL;
export const API_KEY = process.env.API_KEY;

// Utils
function fetchInstruction(message: web3.Message) {
    return message.instructions.find((instruction) => message.accountKeys[instruction.programIdIndex].equals(PROGRAM.programId));
}

export function fetchAccount(index: number, message: web3.Message) {
    const instruction = fetchInstruction(message);
    return message.accountKeys[instruction.accounts[index]].toBase58();
}

export function decodeInstruction(message: web3.Message) {
    const instruction = fetchInstruction(message);
    const instructionCoder = new anchor.BorshInstructionCoder(IDL as anchor.Idl);
    return instructionCoder.decode(bs58.decode(instruction.data.toString()));
}
