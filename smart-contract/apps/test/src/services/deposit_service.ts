import { Keypair, PublicKey, SystemProgram, SYSVAR_CLOCK_PUBKEY } from "@solana/web3.js";
import { Deposit } from "../models/deposit";
import { CONNECTION, PROGRAM } from "../config";
import { Asset } from "../models/asset";
import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { BN } from "@coral-xyz/anchor";
import { createLog, Method, TAG } from "../utils";

export async function createDeposit(assetPubKey: PublicKey, userWallet: Keypair) {
    let signature = undefined;
    let logs = [];
    let deposit = await Deposit.factory(assetPubKey, userWallet.publicKey);
    let depositAsset = await Asset.from(assetPubKey);
    let reserveVault = await depositAsset.reserveVaultFactory();
    let userReserveVault = await depositAsset.userReserveVaultFactory(userWallet.publicKey);
    let depositVault = await depositAsset.depositVaultFactory(userWallet.publicKey);
    try {
        if (!deposit.init) {
            signature = await PROGRAM.methods
            .createDeposit()
            .accountsPartial({
                userWallet: userWallet.publicKey,
                representativeMint: depositAsset.representativeMintPubkey,
                bank: depositAsset.bank,
                asset: depositAsset.publicKey,
                deposit: deposit.publicKey,
                depositVault: depositVault.publicKey,
                systemProgram: SystemProgram.programId,
                tokenProgram: TOKEN_PROGRAM_ID,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                clock: SYSVAR_CLOCK_PUBKEY
            })
            .signers([userWallet])
            .rpc();
            const txDetails = await CONNECTION.getTransaction(signature, {commitment: 'confirmed'});
            logs = txDetails.meta.logMessages;
            deposit = await Deposit.from(deposit.publicKey);
            depositAsset = await Asset.from(assetPubKey);
            reserveVault = await depositAsset.reserveVaultFactory();
            userReserveVault = await depositAsset.userReserveVaultFactory(userWallet.publicKey);
            depositVault = await depositAsset.depositVaultFactory(userWallet.publicKey);
        }
        return deposit;
    } catch (error) {
        logs = error;
        throw error;
    } finally {
        createLog(
            signature,
            Method.CREATE_DEPOSIT,
            [
                {name: TAG.DEPOSIT_ASSET, account: depositAsset.json()},
                {name: TAG.DEPOSIT, account: deposit.json()},
                {name: TAG.RESERVE_VAULT, account: reserveVault.json()},
                {name: TAG.USER_RESERVE_VAULT, account: userReserveVault.json()},
                {name: TAG.DEPOSIT_VAULT, account: depositVault.json()}
            ],
            logs
        );
    }
    
}

export async function depositSol(assetPubKey: PublicKey, userWallet: Keypair, amount: number) {
    let signature = undefined;
    let logs = [];
    let deposit = await Deposit.factory(assetPubKey, userWallet.publicKey);
    let depositAsset = await Asset.from(assetPubKey);
    let reserveVault = await depositAsset.reserveVaultFactory();
    let userReserveVault = await depositAsset.userReserveVaultFactory(userWallet.publicKey);
    let depositVault = await depositAsset.depositVaultFactory(userWallet.publicKey);
    const amountBN = new BN(amount).mul(new BN(10 ** depositAsset.mintDecimals));
    try {
        if (!deposit.init) {
            deposit = await createDeposit(assetPubKey, userWallet);
        }
        signature = await PROGRAM.methods
        .depositSol(amountBN)
        .accountsPartial({
            userWallet: userWallet.publicKey,
            representativeMint: depositAsset.representativeMintPubkey,
            bank: depositAsset.bank,
            asset: depositAsset.publicKey,
            deposit: deposit.publicKey,
            reserveVault: reserveVault.publicKey,
            depositVault: depositVault.publicKey,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            clock: SYSVAR_CLOCK_PUBKEY
        })
        .signers([userWallet])
        .rpc();
        const txDetails = await CONNECTION.getTransaction(signature, {commitment: 'confirmed'});
        logs = txDetails.meta.logMessages;
        deposit = await Deposit.from(deposit.publicKey);
        depositAsset = await Asset.from(assetPubKey);
        reserveVault = await depositAsset.reserveVaultFactory();
        userReserveVault = await depositAsset.userReserveVaultFactory(userWallet.publicKey);
        depositVault = await depositAsset.depositVaultFactory(userWallet.publicKey);
        return deposit;
    } catch (error) {
        logs = error;
        throw error;
    } finally {
        createLog(
            signature,
            Method.DEPOSIT_SOL,
            [
                {name: TAG.DEPOSIT_ASSET, account: depositAsset.json()},
                {name: TAG.DEPOSIT, account: deposit.json()},
                {name: TAG.RESERVE_VAULT, account: reserveVault.json()},
                {name: TAG.USER_RESERVE_VAULT, account: userReserveVault.json()},
                {name: TAG.DEPOSIT_VAULT, account: depositVault.json()}
            ],
            logs,
            [
                {name: TAG.AMOUNT, value: amountBN.toString()}
            ],
        );
    }
}

export async function withdrawSol(assetPubKey: PublicKey, userWallet: Keypair, amount: number) {
    let signature = undefined;
    let logs = [];
    let deposit = await Deposit.factory(assetPubKey, userWallet.publicKey);
    let depositAsset = await Asset.from(assetPubKey);
    let reserveVault = await depositAsset.reserveVaultFactory();
    let userReserveVault = await depositAsset.userReserveVaultFactory(userWallet.publicKey);
    let depositVault = await depositAsset.depositVaultFactory(userWallet.publicKey);
    let amountBN = new BN(amount).mul(new BN(10 ** depositAsset.mintDecimals));
    try {
        signature = await PROGRAM.methods
        .withdrawSol(amountBN)
        .accountsPartial({
            userWallet: userWallet.publicKey,
            representativeMint: depositAsset.representativeMintPubkey,
            bank: depositAsset.bank,
            asset: depositAsset.publicKey,
            deposit: deposit.publicKey,
            reserveVault: reserveVault.publicKey,
            depositVault: depositVault.publicKey,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            clock: SYSVAR_CLOCK_PUBKEY
        })
        .signers([userWallet])
        .rpc();
        const txDetails = await CONNECTION.getTransaction(signature, {commitment: 'confirmed'});
        logs = txDetails.meta.logMessages;
        deposit = await Deposit.from(deposit.publicKey);
        depositAsset = await Asset.from(assetPubKey);
        reserveVault = await depositAsset.reserveVaultFactory();
        userReserveVault = await depositAsset.userReserveVaultFactory(userWallet.publicKey);
        depositVault = await depositAsset.depositVaultFactory(userWallet.publicKey);
        return deposit;
    } catch (error) {
        logs = error;
        throw error;
    } finally {
        createLog(
            signature,
            Method.WITHDRAW_SOL,
            [
                {name: TAG.DEPOSIT_ASSET, account: depositAsset.json()},
                {name: TAG.DEPOSIT, account: deposit.json()},
                {name: TAG.RESERVE_VAULT, account: reserveVault.json()},
                {name: TAG.USER_RESERVE_VAULT, account: userReserveVault.json()},
                {name: TAG.DEPOSIT_VAULT, account: depositVault.json()}
            ],
            logs,
            [
                {name: TAG.AMOUNT, value: amountBN.toString()}
            ],
        );
    }
}

export async function depositToken(assetPubKey: PublicKey, userWallet: Keypair, amount: number) {
    let signature = undefined;
    let logs = [];
    let deposit = await Deposit.factory(assetPubKey, userWallet.publicKey);
    let depositAsset = await Asset.from(assetPubKey);
    let reserveVault = await depositAsset.reserveVaultFactory();
    let userReserveVault = await depositAsset.userReserveVaultFactory(userWallet.publicKey);
    let depositVault = await depositAsset.depositVaultFactory(userWallet.publicKey);
    const amountBN = new BN(amount).mul(new BN(10 ** depositAsset.mintDecimals));
    try {
        if (!deposit.init) {
            deposit = await createDeposit(assetPubKey, userWallet);
        }
        signature = await PROGRAM.methods
        .depositToken(amountBN)
        .accountsPartial({
            userWallet: userWallet.publicKey,
            mint: depositAsset.mintPubkey,
            representativeMint: depositAsset.representativeMintPubkey,
            bank: depositAsset.bank,
            asset: depositAsset.publicKey,
            deposit: deposit.publicKey,
            depositVault: depositVault.publicKey,
            userTokenReserve: userReserveVault.publicKey,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            clock: SYSVAR_CLOCK_PUBKEY
        })
        .signers([userWallet])
        .rpc();
        const txDetails = await CONNECTION.getTransaction(signature, {commitment: 'confirmed'});
        logs = txDetails.meta.logMessages;
        deposit = await Deposit.from(deposit.publicKey);
        depositAsset = await Asset.from(assetPubKey);
        reserveVault = await depositAsset.reserveVaultFactory();
        userReserveVault = await depositAsset.userReserveVaultFactory(userWallet.publicKey);
        depositVault = await depositAsset.depositVaultFactory(userWallet.publicKey);
        return deposit;
    } catch (error) {
        logs = error;
        throw error;
    } finally {
        createLog(
            signature,
            Method.DEPOSIT_TOKEN,
            [
                {name: TAG.DEPOSIT_ASSET, account: depositAsset.json()},
                {name: TAG.DEPOSIT, account: deposit.json()},
                {name: TAG.RESERVE_VAULT, account: reserveVault.json()},
                {name: TAG.USER_RESERVE_VAULT, account: userReserveVault.json()},
                {name: TAG.DEPOSIT_VAULT, account: depositVault.json()}
            ],
            logs,
            [
                {name: TAG.AMOUNT, value: amountBN.toString()}
            ],
        );
    }
}

export async function withdrawToken(assetPubKey: PublicKey, userWallet: Keypair, amount: number) {
    let signature = undefined;
    let logs = [];
    let deposit = await Deposit.factory(assetPubKey, userWallet.publicKey);
    let depositAsset = await Asset.from(assetPubKey);
    let reserveVault = await depositAsset.reserveVaultFactory();
    let userReserveVault = await depositAsset.userReserveVaultFactory(userWallet.publicKey);
    let depositVault = await depositAsset.depositVaultFactory(userWallet.publicKey);
    const amountBN = new BN(amount).mul(new BN(10 ** depositAsset.mintDecimals));
    try {
        signature = await PROGRAM.methods
        .withdrawToken(amountBN)
        .accountsPartial({
            userWallet: userWallet.publicKey,
            mint: depositAsset.mintPubkey,
            representativeMint: depositAsset.representativeMintPubkey,
            bank: depositAsset.bank,
            asset: depositAsset.publicKey,
            deposit: deposit.publicKey,
            depositVault: depositVault.publicKey,
            userTokenReserve: userReserveVault.publicKey,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            clock: SYSVAR_CLOCK_PUBKEY
        })
        .signers([userWallet])
        .rpc();
        const txDetails = await CONNECTION.getTransaction(signature, {commitment: 'confirmed'});
        logs = txDetails.meta.logMessages;
        deposit = await Deposit.from(deposit.publicKey);
        depositAsset = await Asset.from(assetPubKey);
        reserveVault = await depositAsset.reserveVaultFactory();
        userReserveVault = await depositAsset.userReserveVaultFactory(userWallet.publicKey);
        depositVault = await depositAsset.depositVaultFactory(userWallet.publicKey);
        return deposit;
    } catch (error) {
        logs = error;
        throw error;
    } finally {
        createLog(
            signature,
            Method.DEPOSIT_TOKEN,
            [
                {name: TAG.DEPOSIT_ASSET, account: depositAsset.json()},
                {name: TAG.DEPOSIT, account: deposit.json()},
                {name: TAG.RESERVE_VAULT, account: reserveVault.json()},
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

export async function fetchUserDeposits(userPubKey: PublicKey) {
    const deposits = await PROGRAM.account.deposit.all();
    const userDeposits = deposits.filter(deposit => deposit.account.user.equals(userPubKey));
    return userDeposits.map(deposit => new Deposit(deposit.publicKey, deposit.account));
}