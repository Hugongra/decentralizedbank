import { TransactionResponse } from "@solana/web3.js";
import { Log } from "../models/log";
import { API_KEY, API_URL } from "../config";
import { decodeInstruction, fetchAccount, PROGRAM } from "../config";
import axios from 'axios';
import https from 'https';

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

const CONTROLLER = '/deposit';

export async function handleCreateDeposit(log: Log, txInfo: TransactionResponse) {
    const message = txInfo.transaction.message;
    const url = new URL(`${API_URL}${CONTROLLER}/admin`);
    url.searchParams.append("logId", log.id.toString());
    try {
        const depositPublicKey = fetchAccount(4, message);
        const userPublicKey = fetchAccount(0, message);
        const assetPublicKey = fetchAccount(3, message);
        await axios.post(url.toString(),
        {
            publicKey: depositPublicKey,
            userPublicKey,
            assetPublicKey
        },
        {
            httpsAgent,
            headers: {
                'Content-Type': 'application/json',
                token: API_KEY
            }
        });
        console.log(`${new Date().toISOString()} CreateDeposit - Processed log ${log.signature}`);
    } catch (error) {
        console.log(`${new Date().toISOString()} CreateDeposit - Failed to process ${log.signature} error:
        ${error}`);
        return undefined;
    }
}

export async function handleDepositSol(log: Log, txInfo: TransactionResponse) {
    const message = txInfo.transaction.message;
    const url = new URL(`${API_URL}${CONTROLLER}/admin/record`);
    url.searchParams.append("logId", log.id.toString());
    try {
        const amount = decodeInstruction(message).data['amount'].toString();
        const depositPublicKey = fetchAccount(4, message);
        const assetPublicKey = fetchAccount(3, message);
        const deposit = await PROGRAM.account.deposit.fetch(depositPublicKey);
        const asset = await PROGRAM.account.asset.fetch(assetPublicKey);
        await axios.post(url.toString(),
        {
            depositPublicKey,
            amount,
            assetRecord: {
                publicKey: assetPublicKey,
                depositApr: asset.depositApr,
                borrowApr: asset.borrowApr,
                depositAmount: asset.depositAmount.toString(),
                borrowAmount: asset.borrowAmount.toString(),
                depositGlobalRate: asset.depositGlobalRate.toString(),
                borrowGlobalRate: asset.borrowGlobalRate.toString()
            },
            depositRateIndex: deposit.depositRateIndex.toString(),
            depositAmount: deposit.amount.toString()
        },
        {
            httpsAgent,
            headers: {
                'Content-Type': 'application/json',
                token: API_KEY
            }
        });
        console.log(`${new Date().toISOString()} DepositSol - Processed log ${log.signature}`);
    } catch (error) {
        console.log(`${new Date().toISOString()} DepositSol - Failed to process ${log.signature} error:
        ${error}`);
        return undefined;
    }
}

export async function handleWithdrawSol(log: Log, txInfo: TransactionResponse) {
    const message = txInfo.transaction.message;
    const url = new URL(`${API_URL}${CONTROLLER}/admin/record`);
    url.searchParams.append("logId", log.id.toString());
    try {
        const amount = decodeInstruction(message).data['amount'].toString();
        const depositPublicKey = fetchAccount(4, message);
        const assetPublicKey = fetchAccount(3, message);
        const deposit = await PROGRAM.account.deposit.fetch(depositPublicKey);
        const asset = await PROGRAM.account.asset.fetch(assetPublicKey);
        await axios.post(url.toString(),
        {
            depositPublicKey,
            amount,
            assetRecord: {
                publicKey: assetPublicKey,
                depositApr: asset.depositApr,
                borrowApr: asset.borrowApr,
                depositAmount: asset.depositAmount.toString(),
                borrowAmount: asset.borrowAmount.toString(),
                depositGlobalRate: asset.depositGlobalRate.toString(),
                borrowGlobalRate: asset.borrowGlobalRate.toString()
            },
            depositRateIndex: deposit.depositRateIndex.toString(),
            depositAmount: deposit.amount.toString()
        },
        {
            httpsAgent,
            headers: {
                'Content-Type': 'application/json',
                token: API_KEY
            }
        });
        console.log(`${new Date().toISOString()} DepositSol - Processed log ${log.signature}`);
    } catch (error) {
        console.log(`${new Date().toISOString()} DepositSol - Failed to process ${log.signature} error:
        ${error}`);
    }
}

export async function handleDepositToken(log: Log, txInfo: TransactionResponse) {
    const message = txInfo.transaction.message;
    const url = new URL(`${API_URL}${CONTROLLER}/admin/record`);
    url.searchParams.append("logId", log.id.toString());
    try {
        const amount = decodeInstruction(message).data['amount'].toString();
        const depositPublicKey = fetchAccount(5, message);
        const assetPublicKey = fetchAccount(4, message);
        const deposit = await PROGRAM.account.deposit.fetch(depositPublicKey);
        const asset = await PROGRAM.account.asset.fetch(assetPublicKey);
        await axios.post(url.toString(),
        {
            depositPublicKey,
            amount,
            assetRecord: {
                publicKey: assetPublicKey,
                depositApr: asset.depositApr,
                borrowApr: asset.borrowApr,
                depositAmount: asset.depositAmount.toString(),
                borrowAmount: asset.borrowAmount.toString(),
                depositGlobalRate: asset.depositGlobalRate.toString(),
                borrowGlobalRate: asset.borrowGlobalRate.toString()
            },
            depositRateIndex: deposit.depositRateIndex.toString(),
            depositAmount: deposit.amount.toString()
        },
        {
            httpsAgent,
            headers: {
                'Content-Type': 'application/json',
                token: API_KEY
            }
        });
        console.log(`${new Date().toISOString()} DepositToken - Processed log ${log.signature}`);
    } catch (error) {
        console.log(`${new Date().toISOString()} DepositToken - Failed to process ${log.signature} error:
        ${error}`);
    }
}

export async function handleWithdrawToken(log: Log, txInfo: TransactionResponse) {
    const message = txInfo.transaction.message;
    const url = new URL(`${API_URL}${CONTROLLER}/admin/record`);
    url.searchParams.append("logId", log.id.toString());
    try {
        const amount = decodeInstruction(message).data['amount'].toString();
        const depositPublicKey = fetchAccount(5, message);
        const assetPublicKey = fetchAccount(4, message);
        const deposit = await PROGRAM.account.deposit.fetch(depositPublicKey);
        const asset = await PROGRAM.account.asset.fetch(assetPublicKey);
        await axios.post(url.toString(),
        {
            depositPublicKey,
            amount,
            assetRecord: {
                publicKey: assetPublicKey,
                depositApr: asset.depositApr,
                borrowApr: asset.borrowApr,
                depositAmount: asset.depositAmount.toString(),
                borrowAmount: asset.borrowAmount.toString(),
                depositGlobalRate: asset.depositGlobalRate.toString(),
                borrowGlobalRate: asset.borrowGlobalRate.toString()
            },
            depositRateIndex: deposit.depositRateIndex.toString(),
            depositAmount: deposit.amount.toString()
        },
        {
            httpsAgent,
            headers: {
                'Content-Type': 'application/json',
                token: API_KEY
            }
        });
        console.log(`${new Date().toISOString()} WithdrawToken - Processed log ${log.signature}`);
    } catch (error) {
        console.log(`${new Date().toISOString()} WithdrawToken - Failed to process ${log.signature} error:
        ${error}`);
        return undefined;
    }
}
