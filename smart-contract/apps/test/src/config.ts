import * as web3 from '@solana/web3.js'
import * as anchor from '@coral-xyz/anchor';
import fs from 'fs';
import path from 'path';
import * as dotenv from 'dotenv';
import { GetBank } from './get_bank';

dotenv.config();

// Base
export const DELAY = parseInt(process.env.DELAY || '30000');

// Wallets
const WALLETS_PATH = path.join(__dirname, '..', '..', 'wallets');
const BOTS_KEYS_PATH = path.join(WALLETS_PATH, 'bots');
export const ADMIN_WALLET = web3.Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(path.join(WALLETS_PATH, 'admin-wallet.json'), 'utf-8'))));
export const ALICE_WALLET = web3.Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(path.join(WALLETS_PATH, 'alice-wallet.json'), 'utf-8'))));
export const BOB_WALLET = web3.Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(path.join(WALLETS_PATH, 'bob-wallet.json'), 'utf-8'))));
export const FEE_WALLET = web3.Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(path.join(WALLETS_PATH, 'fee-wallet.json'), 'utf-8'))));
export const MALLORY_WALLET = web3.Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(path.join(WALLETS_PATH, 'mallory-wallet.json'), 'utf-8'))));
export const LIQUIDATOR_WALLET = web3.Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(path.join(WALLETS_PATH, 'liquidator-wallet.json'), 'utf-8'))));
export const BOTS_WALLETS = () => {
    const wallets = [];
    fs.readdirSync(BOTS_KEYS_PATH).forEach((file) => {
        if (file.endsWith('.json')) {
            const filePath = path.join(BOTS_KEYS_PATH, file);
            const wallet = web3.Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(filePath, 'utf-8'))));
            wallets.push(wallet);
        }
    });
    return wallets;
}

// Smart Contract
const IDL = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', '..', '..', 'target', 'idl', 'get_bank.json'), 'utf8'));
export const CONNECTION = new web3.Connection(process.env.BLOCKCHAIN_URL, 'confirmed');
const PROVIDER = new anchor.AnchorProvider(CONNECTION, new anchor.Wallet(ADMIN_WALLET), { commitment: "confirmed" });
export const PROGRAM = new anchor.Program<GetBank>(IDL, PROVIDER);

// Addresses
export const LIQUIDATOR_PUBKEY = new web3.PublicKey(process.env.LIQUIDATOR_ADDRESS);
export const FEE_VAULT_PUBKEY = new web3.PublicKey(process.env.FEE_VAULT_ADDRESS);
export const SOL_REPRESENTATIVE_MINT_PUBKEY = new web3.PublicKey(process.env.SOL_REPRESENTATIVE_MINT_ADDRESS);
export const USDC_MINT_PUBKEY = new web3.PublicKey(process.env.USDC_MINT_ADDRESS);
export const USDC_REPRESENTATIVE_MINT_PUBKEY = new web3.PublicKey(process.env.USDC_REPRESENTATIVE_MINT_ADDRESS);
export const BTC_MINT_PUBKEY = new web3.PublicKey(process.env.BTC_MINT_ADDRESS);
export const BTC_REPRESENTATIVE_MINT_PUBKEY = new web3.PublicKey(process.env.BTC_REPRESENTATIVE_MINT_ADDRESS);
export const ETH_MINT_PUBKEY = new web3.PublicKey(process.env.ETH_MINT_ADDRESS);
export const ETH_REPRESENTATIVE_MINT_PUBKEY = new web3.PublicKey(process.env.ETH_REPRESENTATIVE_MINT_ADDRESS);
export const USDT_MINT_PUBKEY = new web3.PublicKey(process.env.USDT_MINT_ADDRESS);
export const USDT_REPRESENTATIVE_MINT_PUBKEY = new web3.PublicKey(process.env.USDT_REPRESENTATIVE_MINT_ADDRESS);
export const XRP_MINT_PUBKEY = new web3.PublicKey(process.env.XRP_MINT_ADDRESS);
export const XRP_REPRESENTATIVE_MINT_PUBKEY = new web3.PublicKey(process.env.XRP_REPRESENTATIVE_MINT_ADDRESS);
export const ADA_MINT_PUBKEY = new web3.PublicKey(process.env.ADA_MINT_ADDRESS);
export const ADA_REPRESENTATIVE_MINT_PUBKEY = new web3.PublicKey(process.env.ADA_REPRESENTATIVE_MINT_ADDRESS);

// Logs
export const LOGS_PATH = path.join(__dirname, '..', '..', 'logs');
