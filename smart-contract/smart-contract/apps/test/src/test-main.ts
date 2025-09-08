import { BN } from "@coral-xyz/anchor";
import { ADA_MINT_PUBKEY, ADA_REPRESENTATIVE_MINT_PUBKEY, ALICE_WALLET, BOB_WALLET, BOTS_WALLETS, BTC_MINT_PUBKEY, BTC_REPRESENTATIVE_MINT_PUBKEY, DELAY, ETH_MINT_PUBKEY, ETH_REPRESENTATIVE_MINT_PUBKEY, MALLORY_WALLET, USDC_MINT_PUBKEY, USDC_REPRESENTATIVE_MINT_PUBKEY, USDT_MINT_PUBKEY, USDT_REPRESENTATIVE_MINT_PUBKEY, XRP_MINT_PUBKEY, XRP_REPRESENTATIVE_MINT_PUBKEY } from "./config";
import { fetchTokenAccount } from "./utils";
import * as bankService from "./services/bank_service";
import * as assetService from "./services/asset_service";
import * as depositService from "./services/deposit_service";
import * as borrowService from "./services/borrow_service";
import { Method } from "./utils";
import { Deposit } from "./models/deposit";
import { SystemAccount } from "./models/system_account";
import { XAccount } from "./models/account";
import { Borrow } from "./models/borrow";
import { Asset, assetConfigFactory } from "./models/asset";

const BOTS = BOTS_WALLETS();

const randomMethod = (): Method => {
    const rand = Math.random();
    if (rand < 0.125) {
        return ;
    } else if (rand < 0.25) {
        return Method.DEPOSIT_SOL;
    } else if (rand < 0.375) {
        return Method.DEPOSIT_TOKEN;
    } else if (rand < 0.5) {
        return Method.WITHDRAW_SOL;
    } else if (rand < 0.625) {
        return Method.WITHDRAW_TOKEN;
    } else if (rand < 0.75) {
        return Method.BORROW_SOL;
    } else if (rand < 0.875) {
        return Method.BORROW_TOKEN;
    } else {
        return Method.REPAY_SOL;
    }
}

const randomWallet = () => {
    const rand = Math.random();
    if (rand < 0.1) {
        return ALICE_WALLET;
    } else if (rand < 0.2) {
        return BOB_WALLET;
    } else if (rand < 0.3) {
        return MALLORY_WALLET;
    }
    return BOTS[Math.floor(Math.random() * BOTS.length)];
}

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const randomAmount = (max: number) => {
    return Math.random() * max;
}

const randomPrice = (max: number, min: number) => {
    return Math.random() * (max - min) + min;
}

const randomAccount = (accounts: XAccount[]) => {
    return accounts[Math.floor(Math.random() * accounts.length)];
};

function calculateInterestAmount(amount: BN, globalRate: BN, rateIndex: BN, mintDecimals: number): number {
    const rate = globalRate.sub(rateIndex).add(new BN(1));
    return amount.mul(rate).div(new BN(10).pow(new BN(mintDecimals))).toNumber();
}

(async () => {
    const bank = await bankService.createBank();
    const solAsset = await assetService.createSolAsset(bank.publicKey, assetConfigFactory(5, 10, 8000));
    const splTokensAssets: Asset[] = [];
    splTokensAssets.push(await assetService.createTokenAsset(bank.publicKey, USDC_MINT_PUBKEY, USDC_REPRESENTATIVE_MINT_PUBKEY, assetConfigFactory(3, 7, 10000)));
    splTokensAssets.push(await assetService.createTokenAsset(bank.publicKey, BTC_MINT_PUBKEY, BTC_REPRESENTATIVE_MINT_PUBKEY, assetConfigFactory(3, 12, 9500)));
    splTokensAssets.push(await assetService.createTokenAsset(bank.publicKey, ETH_MINT_PUBKEY, ETH_REPRESENTATIVE_MINT_PUBKEY, assetConfigFactory(1, 4, 6000)));
    splTokensAssets.push(await assetService.createTokenAsset(bank.publicKey, USDT_MINT_PUBKEY, USDT_REPRESENTATIVE_MINT_PUBKEY, assetConfigFactory(3, 7, 10000)));
    splTokensAssets.push(await assetService.createTokenAsset(bank.publicKey, XRP_MINT_PUBKEY, XRP_REPRESENTATIVE_MINT_PUBKEY, assetConfigFactory(3, 20, 5000)));
    splTokensAssets.push(await assetService.createTokenAsset(bank.publicKey, ADA_MINT_PUBKEY, ADA_REPRESENTATIVE_MINT_PUBKEY, assetConfigFactory(5, 25, 5000)));
    const radomSplTokenAsset = () => splTokensAssets[Math.floor(Math.random() * splTokensAssets.length)].publicKey;
    while (true) {
        const wallet = randomWallet();
        const method = randomMethod();
        let dalayTime = DELAY;
        switch (method) {
            case Method.DEPOSIT_SOL: {
                const userReserveVault = await SystemAccount.from(wallet.publicKey);
                const amount = randomAmount(userReserveVault.amount);
                try {
                    await depositService.depositSol(solAsset.publicKey, wallet, amount);
                } catch (error) {
                    dalayTime = 0;
                    break;
                }
                break;
            }
            case Method.DEPOSIT_TOKEN: {
                const depositAsset = await Asset.from(radomSplTokenAsset());
                const userReserveVault = await fetchTokenAccount(wallet.publicKey, false, depositAsset.mintPubkey, depositAsset.mintDecimals);
                const amount = randomAmount(userReserveVault.amount);
                try {
                    await depositService.depositToken(depositAsset.publicKey, wallet, amount);
                } catch (error) {
                    dalayTime = 0;
                    break;
                }
                break;
            }
            case Method.WITHDRAW_SOL: {
                const deposit = await Deposit.factory(solAsset.publicKey, wallet.publicKey);
                const depositAsset = await Asset.from(solAsset.publicKey);
                if (!deposit.init) {
                    dalayTime = 0;
                    break;
                }
                const depositVault = await fetchTokenAccount(wallet.publicKey, false, depositAsset.representativeMintPubkey);
                const interestAmount = calculateInterestAmount(depositVault.lamports, depositAsset.depositGlobalRate, deposit.depositRateIndex, depositAsset.mintDecimals);
                const amount = randomAmount(interestAmount);
                try {
                    await depositService.withdrawSol(depositAsset.publicKey, wallet, amount);
                } catch (error) {
                    dalayTime = 0;
                    break;
                }
                break;
            }
            case Method.WITHDRAW_TOKEN: {
                const depositAsset = await Asset.from(radomSplTokenAsset());
                const deposit = await Deposit.factory(depositAsset.publicKey, wallet.publicKey);
                if (!deposit.init) {
                    dalayTime = 0;
                    break;
                }
                const depositVault = await fetchTokenAccount(wallet.publicKey, false, depositAsset.representativeMintPubkey);
                const interestAmount = calculateInterestAmount(depositVault.lamports, depositAsset.depositGlobalRate, deposit.depositRateIndex, depositAsset.mintDecimals);
                const amount = randomAmount(interestAmount);
                try {
                    await depositService.withdrawToken(depositAsset.publicKey, wallet, amount);
                } catch (error) {
                    dalayTime = 0;
                    break;
                }
                break;
            }
            case Method.BORROW_SOL: {
                const deposit = randomAccount(await depositService.fetchUserDeposits(wallet.publicKey)) as Deposit;
                if (!deposit) {
                    dalayTime = 0;
                    break;
                }
                const depositAsset = await assetService.fetchAsset(deposit.asset);
                const depositVault = await fetchTokenAccount(wallet.publicKey, false, depositAsset.representativeMintPubkey, depositAsset.mintDecimals);
                const amount = randomAmount(depositVault.amount);
                try {
                    await borrowService.borrowSol(solAsset.publicKey, depositAsset.publicKey, wallet, amount, randomPrice(200, 100), randomPrice(1.05, 0.95));
                } catch (error) {
                    dalayTime = 0;
                    break;
                }
                break;
            }
            case Method.BORROW_TOKEN: {
                const borrowAsset = await Asset.from(radomSplTokenAsset());
                const deposit = randomAccount(await depositService.fetchUserDeposits(wallet.publicKey)) as Deposit;
                if (!deposit) {
                    dalayTime = 0;
                    break;
                }
                const depositAsset = await assetService.fetchAsset(deposit.asset);
                const depositVault = await fetchTokenAccount(wallet.publicKey, false, depositAsset.representativeMintPubkey, depositAsset.mintDecimals);
                const amount = randomAmount(depositVault.amount);
                const borrowPrice = randomPrice(1.05, 0.95);
                const depositPrice = randomPrice(200, 100);
                try {
                    await borrowService.borrowToken(borrowAsset.publicKey, depositAsset.publicKey, wallet, amount, borrowPrice, depositPrice);
                } catch (error) {
                    dalayTime = 0;
                    break;
                }
                break;
            }
            case Method.REPAY_SOL: {
                const deposit = randomAccount(await depositService.fetchUserDeposits(wallet.publicKey)) as Deposit;
                const borrowAsset = await Asset.from(solAsset.publicKey);
                if (!deposit) {
                    dalayTime = 0;
                    break;
                }
                const depositAsset = await assetService.fetchAsset(deposit.asset);
                const borrow = await Borrow.factory(borrowAsset.publicKey, depositAsset.publicKey, wallet.publicKey);
                if (!borrow.init) {
                    dalayTime = 0;
                    break;
                }
                const interestAmount = calculateInterestAmount(borrow.amount, borrowAsset.borrowGloablRate, borrow.borrowRateIndex, borrowAsset.mintDecimals);
                const amount = randomAmount(interestAmount);
                try {
                    await borrowService.repaySol(borrowAsset.publicKey, depositAsset.publicKey, wallet, amount);
                } catch (error) {
                    dalayTime = 0;
                    break;
                }
                break;
            }
            case Method.REPAY_TOKEN: {
                const borrowAsset = await Asset.from(radomSplTokenAsset());
                const deposit = randomAccount(await depositService.fetchUserDeposits(wallet.publicKey)) as Deposit;
                if (!deposit) {
                    dalayTime = 0;
                    break;
                }
                const depositAsset = await assetService.fetchAsset(deposit.asset);
                const borrow = await Borrow.factory(borrowAsset.publicKey, depositAsset.publicKey, wallet.publicKey);
                if (!borrow.init) {
                    dalayTime = 0;
                    break;
                }
                const interestAmount = calculateInterestAmount(borrow.amount, borrowAsset.borrowGloablRate, borrow.borrowRateIndex, solAsset.mintDecimals);
                const amount = randomAmount(interestAmount);
                try {
                    await borrowService.repayToken(borrowAsset.publicKey, depositAsset.publicKey, wallet, amount);
                } catch (error) {
                    dalayTime = 0;
                    break;
                }
                break;
            }
            default: {
                dalayTime = 0;
            }
        }
        await delay(dalayTime);
    }
})();
