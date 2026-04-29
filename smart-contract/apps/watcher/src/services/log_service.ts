import { API_KEY, API_URL } from "../config";
import axios from 'axios';
import https from 'https';
import { Log } from "../models/log";

const httpsAgent = new https.Agent({ rejectUnauthorized: false });
const CONTROLLER = 'log';

export async function getLastUnprocessedLog() {
    try {
        const response = await axios.get<Log>(`${API_URL}/${CONTROLLER}/admin/smartContract`, {
            httpsAgent,
            headers: {
                'Content-Type': 'application/json',
                token: API_KEY
            }
        });
        console.log(`${new Date().toISOString()} GetLastUnprocessedLog`);
        return response;
    } catch (error) {
        console.log(`${new Date().toISOString()} GetLastUnprocessedLog error:
        ${error}`);
        return undefined;
    }
}

export async function getUnprocessedLogs() {
    try {
        const response = await axios.get<Log[]>(`${API_URL}/${CONTROLLER}/admin/smartContract/list`, {
            httpsAgent,
            headers: {
                'Content-Type': 'application/json',
                token: API_KEY
            }
        });
        console.log(`${new Date().toISOString()} GetUnprocessedLogs`);
        return response;
    } catch (error) {
        console.log(`${new Date().toISOString()} GetUnprocessedLogs error:
        ${error}`);
        return undefined;
    }
}


export async function createLog(signature: string, error: boolean) {
    try {
        await axios.post(`${API_URL}/${CONTROLLER}/admin/smartContract`,
            { signature, error },
            {
                httpsAgent,
                headers: {
                    'Content-Type': 'application/json',
                    token: API_KEY
                }
            }
        );
        console.log(`${new Date().toISOString()} CreatedLog with signature: ${signature}`);
    } catch (error) {
        console.log(`${new Date().toISOString()} CreatingLog error:
        ${error}`);
        return undefined;
    }
}

export async function processLog(logId: number) {
    const url = new URL(`${API_URL}/${CONTROLLER}/admin/smartContract`);
    url.searchParams.append("logId", logId.toString());
    try {
        await axios.put(url.toString(), undefined,
            {
                httpsAgent,
                headers: {
                    'Content-Type': 'application/json',
                    token: API_KEY
                }
            }
        );
        console.log(`${new Date().toISOString()} ProcessedLog with id: ${logId}`);
    } catch (error) {
        console.log(`${new Date().toISOString()} ProcessedLog error:
        ${error}`);
        return undefined;
    }
}
