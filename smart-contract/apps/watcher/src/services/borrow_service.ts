import { TransactionResponse } from "@solana/web3.js";
import { Log } from "../models/log";
import { API_KEY, API_URL } from "../config";
import { decodeInstruction, fetchAccount, PROGRAM } from "../config";
import axios from 'axios';
import https from 'https';

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

const CONTROLLER = '/borrow';

export async function handleBorrowSol(log: Log, txInfo: TransactionResponse) {
    const message = txInfo.transaction.message;
    const url = new URL(`${API_URL}${CONTROLLER}/admin/record`);
    url.searchParams.append("logId", log.id.toString());
    try {
        const amount = decodeInstruction(message).data['amount'].toString();
        const borrowPublicKey = fetchAccount(4, message);
        const userPublicKey = fetchAccount(0, message);
        const borrowAsssetPublicKey = fetchAccount(2, message);
        const collateralAssetPublicKey = fetchAccount(3, message);
        const borrow = await PROGRAM.account.borrow.fetch(borrowPublicKey);
        const borrowAsset = await PROGRAM.account.asset.fetch(borrowAsssetPublicKey);
        const collateralAsset = await PROGRAM.account.asset.fetch(collateralAssetPublicKey);
        await axios.post(url.toString(),
        {
            borrowPublicKey,
            userPublicKey,
            amount,
            borrowAssetRecord:{
                publicKey: borrowAsssetPublicKey,
                depositApr: borrowAsset.depositApr,
                borrowApr: borrowAsset.borrowApr,
                depositAmount: borrowAsset.depositAmount.toString(),
                borrowAmount: borrowAsset.borrowAmount.toString(),
                depositGlobalRate: borrowAsset.depositGlobalRate.toString(),
                borrowGlobalRate: borrowAsset.borrowGlobalRate.toString()
            },
            collateralAssetRecord:{
                publicKey: collateralAssetPublicKey,
                depositApr: collateralAsset.depositApr,
                borrowApr: collateralAsset.borrowApr,
                depositAmount: collateralAsset.depositAmount.toString(),
                borrowAmount: collateralAsset.borrowAmount.toString(),
                depositGlobalRate: collateralAsset.depositGlobalRate.toString(),
                borrowGlobalRate: collateralAsset.borrowGlobalRate.toString()
            },
            borrowAmount: borrow.amount.toString(),
            borrowRateIndex: borrow.borrowRateIndex.toString(),
            collateralAmount: borrow.collateralAmount.toString()
        },
        {
            httpsAgent,
            headers: {
                'Content-Type': 'application/json',
                token: API_KEY
            }
        });
        console.log(`${new Date().toISOString()} BorrowSol - Processed log ${log.signature}`);
    } catch (error) {
        console.log(`${new Date().toISOString()} BorrowSol - Failed to process ${log.signature} error:
        ${error}`);
        return undefined;
    }
}

export async function handleRepaySol(log: Log, txInfo: TransactionResponse) {
    const message = txInfo.transaction.message;
    const url = new URL(`${API_URL}${CONTROLLER}/admin/record`);
    url.searchParams.append("logId", log.id.toString());
    try {
        const amount = decodeInstruction(message).data['amount'].toString();
        const borrowPublicKey = fetchAccount(4, message);
        const userPublicKey = fetchAccount(0, message);
        const borrowAsssetPublicKey = fetchAccount(2, message);
        const collateralAssetPublicKey = fetchAccount(3, message);
        const borrow = await PROGRAM.account.borrow.fetch(borrowPublicKey);
        const borrowAsset = await PROGRAM.account.asset.fetch(borrowAsssetPublicKey);
        const collateralAsset = await PROGRAM.account.asset.fetch(collateralAssetPublicKey);
        await axios.post(url.toString(),
        {
            borrowPublicKey,
            userPublicKey,
            amount,
            borrowAssetRecord:{
                publicKey: borrowAsssetPublicKey,
                depositApr: borrowAsset.depositApr,
                borrowApr: borrowAsset.borrowApr,
                depositAmount: borrowAsset.depositAmount.toString(),
                borrowAmount: borrowAsset.borrowAmount.toString(),
                depositGlobalRate: borrowAsset.depositGlobalRate.toString(),
                borrowGlobalRate: borrowAsset.borrowGlobalRate.toString()
            },
            collateralAssetRecord:{
                publicKey: collateralAssetPublicKey,
                depositApr: collateralAsset.depositApr,
                borrowApr: collateralAsset.borrowApr,
                depositAmount: collateralAsset.depositAmount.toString(),
                borrowAmount: collateralAsset.borrowAmount.toString(),
                depositGlobalRate: collateralAsset.depositGlobalRate.toString(),
                borrowGlobalRate: collateralAsset.borrowGlobalRate.toString()
            },
            borrowAmount: borrow.amount.toString(),
            borrowRateIndex: borrow.borrowRateIndex.toString(),
            collateralAmount: borrow.collateralAmount.toString()
        },
        {
            httpsAgent,
            headers: {
                'Content-Type': 'application/json',
                token: API_KEY
            }
        });
        console.log(`${new Date().toISOString()} RepaySol - Processed log ${log.signature}`);
    } catch (error) {
        console.log(`${new Date().toISOString()} RepaySol - Failed to process ${log.signature} error:
        ${error}`);
        return undefined;
    }
}

export async function handleBorrowToken(log: Log, txInfo: TransactionResponse) {
    const message = txInfo.transaction.message;
    const url = new URL(`${API_URL}${CONTROLLER}/admin/record`);
    url.searchParams.append("logId", log.id.toString());
    try {
        const amount = decodeInstruction(message).data['amount'].toString();
        const borrowPublicKey = fetchAccount(4, message);
        const userPublicKey = fetchAccount(0, message);
        const borrowAsssetPublicKey = fetchAccount(2, message);
        const collateralAssetPublicKey = fetchAccount(3, message);
        const borrow = await PROGRAM.account.borrow.fetch(borrowPublicKey);
        const borrowAsset = await PROGRAM.account.asset.fetch(borrowAsssetPublicKey);
        const collateralAsset = await PROGRAM.account.asset.fetch(collateralAssetPublicKey);
        await axios.post(url.toString(),
        {
            borrowPublicKey,
            userPublicKey,
            amount,
            borrowAssetRecord:{
                publicKey: borrowAsssetPublicKey,
                depositApr: borrowAsset.depositApr,
                borrowApr: borrowAsset.borrowApr,
                depositAmount: borrowAsset.depositAmount.toString(),
                borrowAmount: borrowAsset.borrowAmount.toString(),
                depositGlobalRate: borrowAsset.depositGlobalRate.toString(),
                borrowGlobalRate: borrowAsset.borrowGlobalRate.toString()
            },
            collateralAssetRecord:{
                publicKey: collateralAssetPublicKey,
                depositApr: collateralAsset.depositApr,
                borrowApr: collateralAsset.borrowApr,
                depositAmount: collateralAsset.depositAmount.toString(),
                borrowAmount: collateralAsset.borrowAmount.toString(),
                depositGlobalRate: collateralAsset.depositGlobalRate.toString(),
                borrowGlobalRate: collateralAsset.borrowGlobalRate.toString()
            },
            borrowAmount: borrow.amount.toString(),
            borrowRateIndex: borrow.borrowRateIndex.toString(),
            collateralAmount: borrow.collateralAmount.toString()
        },
        {
            httpsAgent,
            headers: {
                'Content-Type': 'application/json',
                token: API_KEY
            }
        });
        console.log(`${new Date().toISOString()} BorrowToken - Processed log ${log.signature}`);
    } catch (error) {
        console.log(`${new Date().toISOString()} BorrowToken - Failed to process ${log.signature} error:
        ${error}`);
        return undefined;
    }
}

export async function handleRepayToken(log: Log, txInfo: TransactionResponse) {
    const message = txInfo.transaction.message;
    const url = new URL(`${API_URL}${CONTROLLER}/admin/record`);
    url.searchParams.append("logId", log.id.toString());
    try {
        const amount = decodeInstruction(message).data['amount'].toString();
        const borrowPublicKey = fetchAccount(4, message);
        const userPublicKey = fetchAccount(0, message);
        const borrowAsssetPublicKey = fetchAccount(2, message);
        const collateralAssetPublicKey = fetchAccount(3, message);
        const borrow = await PROGRAM.account.borrow.fetch(borrowPublicKey);
        const borrowAsset = await PROGRAM.account.asset.fetch(borrowAsssetPublicKey);
        const collateralAsset = await PROGRAM.account.asset.fetch(collateralAssetPublicKey);
        await axios.post(url.toString(),
        {
            borrowPublicKey,
            userPublicKey,
            amount,
            borrowAssetRecord:{
                publicKey: borrowAsssetPublicKey,
                depositApr: borrowAsset.depositApr,
                borrowApr: borrowAsset.borrowApr,
                depositAmount: borrowAsset.depositAmount.toString(),
                borrowAmount: borrowAsset.borrowAmount.toString(),
                depositGlobalRate: borrowAsset.depositGlobalRate.toString(),
                borrowGlobalRate: borrowAsset.borrowGlobalRate.toString()
            },
            collateralAssetRecord:{
                publicKey: collateralAssetPublicKey,
                depositApr: collateralAsset.depositApr,
                borrowApr: collateralAsset.borrowApr,
                depositAmount: collateralAsset.depositAmount.toString(),
                borrowAmount: collateralAsset.borrowAmount.toString(),
                depositGlobalRate: collateralAsset.depositGlobalRate.toString(),
                borrowGlobalRate: collateralAsset.borrowGlobalRate.toString()
            },
            borrowAmount: borrow.amount.toString(),
            borrowRateIndex: borrow.borrowRateIndex.toString(),
            collateralAmount: borrow.collateralAmount.toString()
        },
        {
            httpsAgent,
            headers: {
                'Content-Type': 'application/json',
                token: API_KEY
            }
        });
        console.log(`${new Date().toISOString()} RepayToken - Processed log ${log.signature}`);
    } catch (error) {
        console.log(`${new Date().toISOString()} RepayToken - Failed to process ${log.signature} error:
        ${error}`);
        return undefined;
    }
}
