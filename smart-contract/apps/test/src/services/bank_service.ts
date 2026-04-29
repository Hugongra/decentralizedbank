import { SystemProgram } from "@solana/web3.js";
import { ADMIN_WALLET, FEE_VAULT_PUBKEY, LIQUIDATOR_PUBKEY, PROGRAM } from "../config";
import { Bank } from "../models/bank";

export async function createBank() {
    let bank = await Bank.factory(ADMIN_WALLET.publicKey);
    try {
        if (!bank.init) {
            const signature = await PROGRAM.methods
            .createBank()
            .accountsPartial({
                adminWallet: ADMIN_WALLET.publicKey,
                bank: bank.publicKey,
                liquidator: LIQUIDATOR_PUBKEY,
                feeVault: FEE_VAULT_PUBKEY,
                systemProgram: SystemProgram.programId
            })
            .signers([ADMIN_WALLET])
            .rpc();
            bank = await Bank.factory(ADMIN_WALLET.publicKey);
            console.log(`Bank Account Created: ${signature}`);
        }
        console.log(`Bank Account PublicKey: ${bank.publicKey} \n`);
        return bank;
    } catch (error) {
        console.log(`Error Creating Bank Account: ${error}`);
        throw error;
    }
}
