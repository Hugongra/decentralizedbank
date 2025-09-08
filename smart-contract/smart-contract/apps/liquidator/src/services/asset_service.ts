import { PublicKey } from "@solana/web3.js";
import { Asset } from "../models/asset";
import { PROGRAM } from "../config";

export async function fetchAsset(publicKey: PublicKey): Promise<Asset> {
    const asset = await PROGRAM.account.asset.fetch(publicKey);
    return new Asset(publicKey, asset);
}