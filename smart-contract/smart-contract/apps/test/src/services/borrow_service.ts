import { Keypair, PublicKey, SystemProgram, SYSVAR_CLOCK_PUBKEY } from "@solana/web3.js";
import { CONNECTION, PROGRAM } from "../config";
import { Borrow } from "../models/borrow";
import { Asset } from "../models/asset";
import { BN } from "@coral-xyz/anchor";
import { Deposit } from "../models/deposit";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Bank } from "../models/bank";
import { createLog, Method, TAG } from "../utils";

export async function borrowSol(
    borrowAssetPubKey: PublicKey, 
    depositAssetPubKey: PublicKey, 
    userWallet: Keypair, 
    amount: number,
    borrowPrice: number,
    depositPrice: number) {
    let signature = undefined;
    let logs = [];
    let borrow = await Borrow.factory(borrowAssetPubKey, depositAssetPubKey, userWallet.publicKey);
    let borrowAsset = await Asset.from(borrowAssetPubKey);
    let depositAsset = await Asset.from(depositAssetPubKey);
    let deposit = await Deposit.factory(depositAsset.publicKey, userWallet.publicKey);
    let reserveVault = await borrowAsset.reserveVaultFactory();
    let collateralVault = await depositAsset.collateralVaultFactory();
    let depositVault = await depositAsset.depositVaultFactory(userWallet.publicKey);
    let userReserveVault = await depositAsset.userReserveVaultFactory(userWallet.publicKey);
    const amountBN = new BN(amount).mul(new BN(10 ** borrowAsset.mintDecimals));
    const borrowPriceBN = new BN((borrowPrice * 100).toFixed(0));
    const depositPriceBN = new BN((depositPrice * 100).toFixed(0));
    try {
        signature = await PROGRAM.methods
        .borrowSol(amountBN, borrowPriceBN, depositPriceBN)
        .accountsPartial({
            userWallet: userWallet.publicKey,
            bank: borrowAsset.bank,
            borrowAsset: borrowAsset.publicKey,
            depositAsset: depositAsset.publicKey,
            borrow: borrow.publicKey,
            deposit: deposit.publicKey,
            reserveVault: reserveVault.publicKey,
            collateralVault: collateralVault.publicKey,
            depositVault: depositVault.publicKey,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            clock: SYSVAR_CLOCK_PUBKEY
        })
        .signers([userWallet])
        .rpc();
        const txDetails = await CONNECTION.getTransaction(signature, {commitment: 'confirmed'});
        logs = txDetails.meta.logMessages;
        borrow = await Borrow.factory(borrowAssetPubKey, depositAssetPubKey, userWallet.publicKey);
        borrowAsset = await Asset.from(borrowAssetPubKey);
        depositAsset = await Asset.from(depositAssetPubKey);
        deposit = await Deposit.factory(depositAsset.publicKey, userWallet.publicKey);
        reserveVault = await borrowAsset.reserveVaultFactory();
        collateralVault = await depositAsset.collateralVaultFactory();
        depositVault = await depositAsset.depositVaultFactory(userWallet.publicKey);
        userReserveVault = await depositAsset.userReserveVaultFactory(userWallet.publicKey);
        return borrow;
    } catch (error) {
        logs = error;
        throw error;
    } finally {
        createLog(
            signature,
            Method.BORROW_SOL,
            [
                {name: TAG.BORROW_ASSET, account: borrowAsset.json()},
                {name: TAG.DEPOSIT_ASSET, account: depositAsset.json()},
                {name: TAG.BORROW, account: borrow.json()},
                {name: TAG.DEPOSIT, account: deposit.json()},
                {name: TAG.RESERVE_VAULT, account: reserveVault.json()},
                {name: TAG.COLLATERAL_VAULT, account: collateralVault.json()},
                {name: TAG.USER_RESERVE_VAULT, account: userReserveVault.json()},
                {name: TAG.DEPOSIT_VAULT, account: depositVault.json()}
            ],
            logs,
            [
                {name: TAG.AMOUNT, value: amountBN.toString()},
                {name: TAG.BORROW_PRICE, value: borrowPriceBN.toString()},
                {name: TAG.DEPOSIT_PRICE, value: depositPriceBN.toString()}
            ]
        );
    }
}

export async function repaySol(
    borrowAssetPubKey: PublicKey, 
    depositAssetPubKey: PublicKey, 
    userWallet: Keypair, 
    amount: number) {
    let signature = undefined;
    let logs = [];
    let borrow = await Borrow.factory(borrowAssetPubKey, depositAssetPubKey, userWallet.publicKey);
    let borrowAsset = await Asset.from(borrowAssetPubKey);
    const bank = await Bank.from(borrowAsset.bank);
    let depositAsset = await Asset.from(depositAssetPubKey);
    let deposit = await Deposit.factory(depositAsset.publicKey, userWallet.publicKey);
    let reserveVault = await borrowAsset.reserveVaultFactory();
    let collateralVault = await depositAsset.collateralVaultFactory();
    let depositVault = await depositAsset.depositVaultFactory(userWallet.publicKey);
    let userReserveVault = await depositAsset.userReserveVaultFactory(userWallet.publicKey);
    let feeVault = await borrowAsset.feeVaultFactory(bank.feeVault);
    const amountBN = new BN(amount).mul(new BN(10 ** borrowAsset.mintDecimals));
    try {
        signature = await PROGRAM.methods
        .repaySol(new BN(amount).mul(new BN(10 ** borrowAsset.mintDecimals)))
        .accountsPartial({
            userWallet: userWallet.publicKey,
            bank: borrowAsset.bank,
            borrowAsset: borrowAsset.publicKey,
            depositAsset: depositAsset.publicKey,
            borrow: borrow.publicKey,
            deposit: deposit.publicKey,
            reserveVault: reserveVault.publicKey,
            collateralVault: collateralVault.publicKey,
            depositVault: depositVault.publicKey,
            feeVault: feeVault.publicKey,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            clock: SYSVAR_CLOCK_PUBKEY
        })
        .signers([userWallet])
        .rpc();
        const txDetails = await CONNECTION.getTransaction(signature, {commitment: 'confirmed'});
        logs = txDetails.meta.logMessages;
        borrow = await Borrow.factory(borrowAssetPubKey, depositAssetPubKey, userWallet.publicKey);
        borrowAsset = await Asset.from(borrowAssetPubKey);
        depositAsset = await Asset.from(depositAssetPubKey);
        deposit = await Deposit.factory(depositAsset.publicKey, userWallet.publicKey);
        reserveVault = await borrowAsset.reserveVaultFactory();
        collateralVault = await depositAsset.collateralVaultFactory();
        depositVault = await depositAsset.depositVaultFactory(userWallet.publicKey);
        userReserveVault = await depositAsset.userReserveVaultFactory(userWallet.publicKey);
        feeVault = await borrowAsset.feeVaultFactory(bank.feeVault);
        return borrow;
    } catch (error) {
        logs = error;
        throw error;
    } finally {
        createLog(
            signature,
            Method.REPAY_SOL,
            [
                {name: TAG.BORROW_ASSET, account: borrowAsset.json()},
                {name: TAG.DEPOSIT_ASSET, account: depositAsset.json()},
                {name: TAG.BORROW, account: borrow.json()},
                {name: TAG.DEPOSIT, account: deposit.json()},
                {name: TAG.RESERVE_VAULT, account: reserveVault.json()},
                {name: TAG.COLLATERAL_VAULT, account: collateralVault.json()},
                {name: TAG.USER_RESERVE_VAULT, account: userReserveVault.json()},
                {name: TAG.DEPOSIT_VAULT, account: depositVault.json()},
                {name: TAG.FEE_VAULT, account: feeVault.json()}
            ],
            logs,
            [
                {name: TAG.AMOUNT, value: amountBN.toString()}
            ]
        );
    }
}

export async function borrowToken(
    borrowAssetPubKey: PublicKey, 
    depositAssetPubKey: PublicKey, 
    userWallet: Keypair, 
    amount: number,
    borrowPrice: number,
    depositPrice: number) {
    let signature = undefined;
    let logs = [];
    let borrow = await Borrow.factory(borrowAssetPubKey, depositAssetPubKey, userWallet.publicKey);
    let borrowAsset = await Asset.from(borrowAssetPubKey);
    let depositAsset = await Asset.from(depositAssetPubKey);
    let deposit = await Deposit.factory(depositAsset.publicKey, userWallet.publicKey);
    let reserveVault = await borrowAsset.reserveVaultFactory();
    let collateralVault = await depositAsset.collateralVaultFactory();
    let userReserveVault = await borrowAsset.userReserveVaultFactory(userWallet.publicKey);
    let depositVault = await depositAsset.depositVaultFactory(userWallet.publicKey);
    const amountBN = new BN(amount).mul(new BN(10 ** borrowAsset.mintDecimals));
    const borrowPriceBN = new BN((borrowPrice * 100).toFixed(0));
    const depositPriceBN = new BN((depositPrice * 100).toFixed(0));
    try {
        signature = await PROGRAM.methods
        .borrowToken(amountBN, borrowPriceBN, depositPriceBN)
        .accountsPartial({
            userWallet: userWallet.publicKey,
            bank: borrowAsset.bank,
            borrowAsset: borrowAsset.publicKey,
            depositAsset: depositAsset.publicKey,
            borrow: borrow.publicKey,
            deposit: deposit.publicKey,
            reserveVault: reserveVault.publicKey,
            collateralVault: collateralVault.publicKey,
            depositVault: depositVault.publicKey,
            userTokenReserve: userReserveVault.publicKey,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            clock: SYSVAR_CLOCK_PUBKEY
        })
        .signers([userWallet])
        .rpc();
        const txDetails = await CONNECTION.getTransaction(signature, {commitment: 'confirmed'});
        logs = txDetails.meta.logMessages;
        borrow = await Borrow.factory(borrowAssetPubKey, depositAssetPubKey, userWallet.publicKey);
        borrowAsset = await Asset.from(borrowAssetPubKey);
        depositAsset = await Asset.from(depositAssetPubKey);
        deposit = await Deposit.factory(depositAsset.publicKey, userWallet.publicKey);
        reserveVault = await borrowAsset.reserveVaultFactory();
        collateralVault = await depositAsset.collateralVaultFactory();
        userReserveVault = await depositAsset.userReserveVaultFactory(userWallet.publicKey);
        depositVault = await depositAsset.depositVaultFactory(userWallet.publicKey);
        return borrow;
    } catch (error) {
        logs = error;
        throw error;
    } finally {
        createLog(
            signature,
            Method.BORROW_TOKEN,
            [
                {name: TAG.BORROW_ASSET, account: borrowAsset.json()},
                {name: TAG.DEPOSIT_ASSET, account: depositAsset.json()},
                {name: TAG.BORROW, account: borrow.json()},
                {name: TAG.DEPOSIT, account: deposit.json()},
                {name: TAG.RESERVE_VAULT, account: reserveVault.json()},
                {name: TAG.COLLATERAL_VAULT, account: collateralVault.json()},
                {name: TAG.USER_RESERVE_VAULT, account: userReserveVault.json()},
                {name: TAG.DEPOSIT_VAULT, account: depositVault.json()}
            ],
            logs,
            [
                {name: TAG.AMOUNT, value: amountBN.toString()}
            ]
        );
    }
}

export async function repayToken(
    borrowAssetPubKey: PublicKey, 
    depositAssetPubKey: PublicKey, 
    userWallet: Keypair, 
    amount: number) {
    let signature = undefined;
    let logs = [];
    let borrow = await Borrow.factory(borrowAssetPubKey, depositAssetPubKey, userWallet.publicKey);
    let borrowAsset = await Asset.from(borrowAssetPubKey);
    const bank = await Bank.from(borrowAsset.bank);
    let depositAsset = await Asset.from(depositAssetPubKey);
    let deposit = await Deposit.factory(depositAsset.publicKey, userWallet.publicKey);
    let reserveVault = await borrowAsset.reserveVaultFactory();
    let collateralVault = await depositAsset.collateralVaultFactory();
    let userReserveVault = await borrowAsset.userReserveVaultFactory(userWallet.publicKey);
    let depositVault = await depositAsset.depositVaultFactory(userWallet.publicKey);
    let feeVault = await borrowAsset.feeVaultFactory(bank.feeVault);
    const amountBN = new BN(amount).mul(new BN(10 ** borrowAsset.mintDecimals));
    try {
        signature = await PROGRAM.methods
        .repayToken(new BN(amount).mul(new BN(10 ** borrowAsset.mintDecimals)))
        .accountsPartial({
            userWallet: userWallet.publicKey,
            bank: borrowAsset.bank,
            borrowAsset: borrowAsset.publicKey,
            depositAsset: depositAsset.publicKey,
            borrow: borrow.publicKey,
            deposit: deposit.publicKey,
            reserveVault: reserveVault.publicKey,
            collateralVault: collateralVault.publicKey,
            depositVault: depositVault.publicKey,
            userTokenReserve: userReserveVault.publicKey,
            feeVault: feeVault.publicKey,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            clock: SYSVAR_CLOCK_PUBKEY
        })
        .signers([userWallet])
        .rpc();
        const txDetails = await CONNECTION.getTransaction(signature, {commitment: 'confirmed'});
        logs = txDetails.meta.logMessages;
        borrow = await Borrow.factory(borrowAssetPubKey, depositAssetPubKey, userWallet.publicKey);
        borrowAsset = await Asset.from(borrowAssetPubKey);
        depositAsset = await Asset.from(depositAssetPubKey);
        deposit = await Deposit.factory(depositAsset.publicKey, userWallet.publicKey);
        reserveVault = await borrowAsset.reserveVaultFactory();
        collateralVault = await depositAsset.collateralVaultFactory();
        depositVault = await depositAsset.depositVaultFactory(userWallet.publicKey);
        userReserveVault = await depositAsset.userReserveVaultFactory(userWallet.publicKey);
        feeVault = await borrowAsset.feeVaultFactory(bank.feeVault);
        return borrow;
    } catch (error) {
        logs = error;
        throw error;
    } finally {
        createLog(
            signature,
            Method.REPAY_TOKEN,
            [
                {name: TAG.BORROW_ASSET, account: borrowAsset.json()},
                {name: TAG.DEPOSIT_ASSET, account: depositAsset.json()},
                {name: TAG.BORROW, account: borrow.json()},
                {name: TAG.DEPOSIT, account: deposit.json()},
                {name: TAG.RESERVE_VAULT, account: reserveVault.json()},
                {name: TAG.COLLATERAL_VAULT, account: collateralVault.json()},
                {name: TAG.USER_RESERVE_VAULT, account: userReserveVault.json()},
                {name: TAG.DEPOSIT_VAULT, account: depositVault.json()},
                {name: TAG.FEE_VAULT, account: feeVault.json()}
            ],
            logs,
            [
                {name: TAG.AMOUNT, value: amountBN.toString()}
            ]
        );
    }
}

export async function fetchUserBorrows(userPubKey: PublicKey) {
    const borrows = (await PROGRAM.account.borrow.all()).filter(borrow => borrow.account.user.equals(userPubKey));
    return borrows.map(borrow => new Borrow(borrow.publicKey, borrow.account));
}