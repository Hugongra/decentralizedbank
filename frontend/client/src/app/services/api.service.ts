import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { PublicKey } from '@solana/web3.js';
import { Asset } from './models/api/asset';
import { RecordFilter } from './models/api/record-filter';
import { TokenPriceRecord } from './models/api/token-price-record';
import { BorrowRecords } from './models/api/borrow-records';
import { Transaction, TransactionFilter } from './models/api/transaction';
import { DepositRecords } from './models/api/deposit-records';
import { Page } from './models/api/page';
import { AssetAprRecords, AssetRateRecords } from './models/api/asset-record';
import { Record } from './models/api/record';

const PATH_PARAM = {
  list: '/list',
  record: '/record',
  find: '/find'
};

const BANK_CONTROLLER = {
  path: '/api/bank/private',
  endpoints: {
    asset: '/asset',
    token: '/token'
  }
};

const BORROW_CONTROLLER = {
  path: '/api/borrow/private'
};

const DEPOSIT_CONTROLLER = {
  path: '/api/deposit/private'
};

const TRANSACTION_CONTROLLER = {
  path: '/api/transaction/private'
};

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  #http = inject(HttpClient);

  getBankAssets(bankPublicKey: string): Observable<Asset[]> {
    return this.#http.get<Asset[]>(`${BANK_CONTROLLER.path}/${bankPublicKey}${BANK_CONTROLLER.endpoints.asset}${PATH_PARAM.list}`);
  }

  getTokenPriceRecords(bankPublicKey: string): Observable<TokenPriceRecord[]> {
    return this.#http.get<TokenPriceRecord[]>(`${BANK_CONTROLLER.path}/${bankPublicKey}${BANK_CONTROLLER.endpoints.token}${PATH_PARAM.record}${PATH_PARAM.list}`);
  }

  getAssetRateRecords(publicKey: string, filter: RecordFilter): Observable<AssetRateRecords> {
    return this.#http.put<AssetRateRecords>(`${BANK_CONTROLLER.path}${BANK_CONTROLLER.endpoints.asset}/${publicKey}${PATH_PARAM.record}:rate${PATH_PARAM.find}`, filter);
  }

  getAssetUtilizationRateRecords(publicKey: string, filter: RecordFilter): Observable<Record[]> {
    return this.#http.put<Record[]>(`${BANK_CONTROLLER.path}${BANK_CONTROLLER.endpoints.asset}/${publicKey}${PATH_PARAM.record}:utilizationRate${PATH_PARAM.find}`, filter);
  }

  getAssetAprRecords(publicKey: string, filter: RecordFilter): Observable<AssetAprRecords> {
    return this.#http.put<AssetAprRecords>(`${BANK_CONTROLLER.path}${BANK_CONTROLLER.endpoints.asset}/${publicKey}${PATH_PARAM.record}:apr${PATH_PARAM.find}`, filter);
  }

  getUserDeposits(bankPubkey: string, userPubkey: string): Observable<PublicKey[]> {
    return this.#http.get<{id: number, publicKey: string, assetPublicKey: string}[]>(`${DEPOSIT_CONTROLLER.path}/${bankPubkey}/${userPubkey}${PATH_PARAM.list}`).pipe(
      map(deposits => deposits.map(deposit => new PublicKey(deposit.publicKey)))
    );
  }

  getUserBorrows(bankPubkey: string, userPubkey: string): Observable<PublicKey[]> {
    return this.#http.get<{id: number, publicKey: string, assetPublicKey: string}[]>(`${BORROW_CONTROLLER.path}/${bankPubkey}/${userPubkey}${PATH_PARAM.list}`).pipe(
      map(borrows => borrows.map(borrow => new PublicKey(borrow.publicKey)))
    );
  }

  getUserDepositRecords(publicKey: string, filter: RecordFilter): Observable<DepositRecords> {
    return this.#http.put<DepositRecords>(`${DEPOSIT_CONTROLLER.path}/${publicKey}${PATH_PARAM.record}${PATH_PARAM.find}`, filter);
  }

  getUserBorrowRecords(publicKey: string, filter: RecordFilter): Observable<BorrowRecords> {
    return this.#http.put<BorrowRecords>(`${BORROW_CONTROLLER.path}/${publicKey}${PATH_PARAM.record}${PATH_PARAM.find}`, filter);
  }

  findUserTransactions(filter: TransactionFilter): Observable<Page<Transaction>> {
    return this.#http.put<Page<Transaction>>(`${TRANSACTION_CONTROLLER.path}${PATH_PARAM.find}`, filter);
  }

}
