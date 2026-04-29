import * as web3 from '@solana/web3.js'
import * as anchor from '@coral-xyz/anchor';
import fs from 'fs';
import path from 'path';
import * as dotenv from 'dotenv';
import { GetBank } from './get_bank';

dotenv.config();

// Base
export const DELAY = parseInt(process.env.DELAY || '30000');

// Phyt
export const HERMES_URL = process.env.HERMES_URL;

// Wallets
const WALLETS_PATH = process.env.env == 'dev' ? path.join(__dirname, '..', '..', '..', 'test', 'wallets') : path.join(__dirname, '..', '..', '..', 'wallets');
export const LIQUIDATOR_WALLET = web3.Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(path.join(WALLETS_PATH, 'liquidator-wallet.json'), 'utf-8'))));

// Smart Contract
const IDL = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', '..', '..', 'target', 'idl', 'get_bank.json'), 'utf8'));
export const CONNECTION = new web3.Connection(process.env.BLOCKCHAIN_URL, 'confirmed');
const PROVIDER = new anchor.AnchorProvider(CONNECTION, new anchor.Wallet(LIQUIDATOR_WALLET), { commitment: "confirmed" });
export const PROGRAM = new anchor.Program<GetBank>(IDL, PROVIDER);

// Addresses
export const BANK_PUBKEY = new web3.PublicKey(process.env.LIQUIDATOR_ADDRESS);
