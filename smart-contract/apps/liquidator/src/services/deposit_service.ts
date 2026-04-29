import { PublicKey } from "@solana/web3.js";
import { Deposit } from "../models/deposit";
import { PROGRAM } from "../config";

export async function fetchDeposit(publicKey: PublicKey): Promise<Deposit> {
    const deposit = await PROGRAM.account.asset.fetch(publicKey);
    return new Deposit(publicKey, deposit);
}