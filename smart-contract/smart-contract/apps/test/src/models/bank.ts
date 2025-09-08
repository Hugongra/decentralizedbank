import { PublicKey } from "@solana/web3.js";
import { XAccount } from "./account";
import { CONNECTION, PROGRAM } from "../config";

export class Bank extends XAccount {
    
    readonly version: number;
    readonly bumpSeed: number;
    readonly admin: PublicKey;
    readonly liquidator: PublicKey;
    readonly feeVault: PublicKey;
    readonly defcon: number;

    constructor(pubKey: PublicKey, data: any) {
        super(pubKey, data != null);
        if (data) {
            this.version = data.version;
            this.bumpSeed = data.bumpSeed;
            this.admin = data.admin;
            this.liquidator = data.liquidator;
            this.feeVault = data.feeVault;
            this.defcon = data.defcon;
        }
    }

    static pubKeyFactory(adminWallet: PublicKey): PublicKey {
        return PublicKey.findProgramAddressSync(
            [Buffer.from("bank"), adminWallet.toBuffer()],
            PROGRAM.programId
        )[0];
    }

    static async from(publicKey: PublicKey): Promise<Bank> {
        const data = await PROGRAM.account.bank.fetch(publicKey);
        return new Bank(publicKey, data);
    }

    static async factory(adminWallet: PublicKey): Promise<Bank> {
        const pubKey = Bank.pubKeyFactory(adminWallet);
        const accountInfo = await CONNECTION.getAccountInfo(pubKey);
        if (accountInfo) {
            const data = await PROGRAM.account.bank.fetch(pubKey);
            return new Bank(pubKey, data);
        }
        return new Bank(pubKey, accountInfo);
    }

    json(): any {
        return {
            version: this.version,
            bumpSeed: this.bumpSeed,
            admin: this.admin?.toString(),
            liquidator: this.liquidator?.toString(),
            feeVault: this.feeVault?.toString(),
            defcon: this.defcon
        };
    }

}