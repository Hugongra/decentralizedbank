import { ConfirmedSignatureInfo } from "@solana/web3.js";
import { CONNECTION, DELAY, PROGRAM } from "./config"; 
import * as LogService from "./services/log_service";
import * as BankService from "./services/bank_service";
import * as BorrowService from "./services/borrow_service";
import * as DepositService from "./services/deposit_service";

(async () => {
    // Get Last Persisted Log
    let response = await LogService.getLastUnprocessedLog();
    // Subscribe to logs
    CONNECTION.onLogs(
            PROGRAM.programId,
            (log) => {
                LogService.createLog(log.signature, Boolean(log.err));
            },
        "confirmed"
    );
    if (response?.status === 200) {
        /* TODO: Solana only saves the last 15 minutes of logs, so in a real scenario we will have to fetch the unprocessed logs using 
        a third party app, such as helium. Helium has a free tier api, that store the full history of solana transactions.
        
        Remember: This fragment of code is only executed in case the bot is down for a while for any reason, and we want to fetch the all lost logs.*/
        let signatures: ConfirmedSignatureInfo[];
        try {
            const log = response.data;
            signatures = await CONNECTION.getSignaturesForAddress(PROGRAM.programId, {until: log.signature});
        } catch (error) {
            signatures = await CONNECTION.getSignaturesForAddress(PROGRAM.programId);
        }
        for(const signature of signatures) {
            await LogService.createLog(signature.signature, Boolean(signature.err));
        }
    }
    // Handle Unprocessed Logs
    while (true) {
        try {
            const response = await LogService.getUnprocessedLogs();
            if (response?.status !== 200) {
                continue;
            }
            for(const log of response.data) {
                const txInfo = await CONNECTION.getTransaction(log.signature, { commitment: "confirmed" });
                if (txInfo) {
                    if (txInfo.meta.logMessages.includes('Program log: Instruction: CreateBank')) {
                        await BankService.handleCreateBank(log, txInfo);
                    } else if (txInfo.meta.logMessages.includes('Program log: Instruction: CreateSolAsset')) {
                        await BankService.handleCreateSolAsset(log, txInfo);
                    } else if (txInfo.meta.logMessages.includes('Program log: Instruction: CreateTokenAsset')) {
                        await BankService.handleCreateTokenAsset(log, txInfo);
                    } else if (txInfo.meta.logMessages.includes('Program log: Instruction: CreateDeposit')) {
                        await DepositService.handleCreateDeposit(log, txInfo);
                    } else if (txInfo.meta.logMessages.includes('Program log: Instruction: DepositSol')) {
                        await DepositService.handleDepositSol(log, txInfo);
                    } else if (txInfo.meta.logMessages.includes('Program log: Instruction: WithdrawSol')) {
                        await DepositService.handleWithdrawSol(log, txInfo);
                    } else if (txInfo.meta.logMessages.includes('Program log: Instruction: DepositToken')) {
                        await DepositService.handleDepositToken(log, txInfo);
                    } else if (txInfo.meta.logMessages.includes('Program log: Instruction: WithdrawToken')) {
                        await DepositService.handleWithdrawToken(log, txInfo);
                    } else if (txInfo.meta.logMessages.includes('Program log: Instruction: BorrowSol')) {
                        await BorrowService.handleBorrowSol(log, txInfo);
                    } else if (txInfo.meta.logMessages.includes('Program log: Instruction: RepaySol')) {
                        await BorrowService.handleRepaySol(log, txInfo);
                    } else if (txInfo.meta.logMessages.includes('Program log: Instruction: BorrowToken')) {
                        await BorrowService.handleBorrowToken(log, txInfo);
                    } else if (txInfo.meta.logMessages.includes('Program log: Instruction: RepayToken')) {
                        await BorrowService.handleRepayToken(log, txInfo);
                    } else {
                        await LogService.processLog(log.id);
                    }
                }
            }
        } catch (error) {
            console.error(error);
        }
        await new Promise(res => setTimeout(res, DELAY));
    }
})();