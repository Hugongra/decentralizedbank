import { Paginator } from './paginator'

export enum TransactionType {
    DEPOSIT = 'DEPOSIT',
    WITHDRAW = 'WITHDRAW',
    BORROW = 'BORROW',
    REPAY = 'REPAY'
}

export interface Transaction {

    id: number;
    
    type: TransactionType;
    
    timestamp: number;

}

export interface DepositWithdrawTransaction extends Transaction {
    
    depositAmount: number;
    
    depositValue: number;

    depositToken: {
        symbol: string;
        logoUrl: string;
        decimals: number;
    };

}

export interface BorrowRepayTransaction extends Transaction {
    
    borrowAmount: number;
    
    borrowValue: number;

    collateralAmount: number;

    collateralValue: number;

    borrowToken: {
        symbol: string;
        logoUrl: string;
        decimals: number;
    };

    collateralToken: {
        symbol: string;
        logoUrl: string;
        decimals: number;
    };

}

export class TransactionFilter extends Paginator {
    
    userPublicKey: string;

    startDate: number;

    endDate?: number;

    constructor(userPublicKey: string) {
        super(0, 10, 'timestamp');
        this.userPublicKey = userPublicKey;
        this.startDate = new Date().getTime() - 1000 * 60 * 60 * 24 * 7;
    }

}
