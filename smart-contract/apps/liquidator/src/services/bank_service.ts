import { PublicKey } from "@solana/web3.js";
import { Bank } from "../models/bank";
import { PROGRAM } from "../config";

export async function fetchBank(publicKey: PublicKey): Promise<Bank> {
    const asset = await PROGRAM.account.asset.fetch(publicKey);
    return new Bank(publicKey, asset);
}