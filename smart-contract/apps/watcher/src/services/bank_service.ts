import { PublicKey, TransactionResponse } from "@solana/web3.js";
import { Log } from "../models/log";
import { API_KEY, API_URL } from "../config";
import { fetchAccount, PROGRAM } from "../config";
import axios from 'axios';
import https from 'https';

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

const CONTROLLER = '/bank';

export async function handleCreateBank(log: Log, txInfo: TransactionResponse) {
    const message = txInfo.transaction.message;
    const url = new URL(`${API_URL}${CONTROLLER}/admin`);
    url.searchParams.append("logId", log.id.toString());
    try {
        await axios.post(url.toString(),
            { publicKey: fetchAccount(1, message) },
            {
                httpsAgent,
                headers: {
                    'Content-Type': 'application/json',
                    token: API_KEY
                }
            }
        );
        console.log(`${new Date().toISOString()} CreateBank - Processed log ${log.signature}`);
    } catch (error) {
        console.log(`${new Date().toISOString()} CreateBank - Failed to process ${log.signature} error:
        ${error}`);
        return undefined;
    }
}

export async function handleCreateSolAsset(log: Log, txInfo: TransactionResponse) {
    const message = txInfo.transaction.message;
    const url = new URL(`${API_URL}${CONTROLLER}/admin/asset`);
    url.searchParams.append("logId", log.id.toString());
    try {
        const publicKey = fetchAccount(3, message);
        const asset = await PROGRAM.account.asset.fetch(publicKey);
        await axios.post(url.toString(),
        {
            publicKey,
            mintPublicKey: PublicKey.default.toBase58(),
            bankPublicKey: fetchAccount(2, message),
            depositApr: asset.depositApr,
            borrowApr: asset.borrowApr,
            depositAmount: asset.depositAmount.toString(),
            borrowAmount: asset.borrowAmount.toString(),
            depositGlobalRate: asset.depositGlobalRate.toString(),
            borrowGlobalRate: asset.borrowGlobalRate.toString()
        },
        {
            httpsAgent,
            headers: {
                'Content-Type': 'application/json',
                token: API_KEY
            }
        }
    );
        console.log(`${new Date().toISOString()} CreateSolAsset - Processed log ${log.signature}`);
    } catch (error) {
        console.log(`${new Date().toISOString()} CreateSolAsset - Failed to process ${log.signature} error:
        ${error}`);
        return undefined;
    }
}

export async function handleCreateTokenAsset(log: Log, txInfo: TransactionResponse) {
    const message = txInfo.transaction.message;
    const url = new URL(`${API_URL}${CONTROLLER}/admin/asset`);
    url.searchParams.append("logId", log.id.toString());
    try {
        const publicKey = fetchAccount(4, message);
        const asset = await PROGRAM.account.asset.fetch(publicKey);
        await axios.post(url.toString(),
        {
            publicKey,
            mintPublicKey: fetchAccount(1, message),
            bankPublicKey: fetchAccount(3, message),
            depositApr: asset.depositApr,
            borrowApr: asset.borrowApr,
            depositAmount: asset.depositAmount.toString(),
            borrowAmount: asset.borrowAmount.toString(),
            depositGlobalRate: asset.depositGlobalRate.toString(),
            borrowGlobalRate: asset.borrowGlobalRate.toString()
        },
        {
            httpsAgent,
            headers: {
                'Content-Type': 'application/json',
                token: API_KEY
            }
        });
        console.log(`${new Date().toISOString()} CreateTokenAsset - Processed log ${log.signature}`);
    } catch (error) {
        console.log(`${new Date().toISOString()} CreateTokenAsset - Failed to process ${log.signature} error:
        ${error}`);
        return undefined;
    }
}
