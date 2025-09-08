import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Asset } from './models/asset';
import { Observable } from 'rxjs';
import { TokenPriceRecord } from './models/token-price-record';

const PATH_PARAM = {
  list: '/list',
  record: '/record',
  find: '/find'
};

const BANK_CONTROLLER = {
  path: '/bank/private',
  endpoints: {
    asset: '/asset',
    token: '/token'
  }
};

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  #http = inject(HttpClient);

  getBankAssets(bankPublicKey: string): Observable<Asset[]> {
    return this.#http.get<Asset[]>(`${BANK_CONTROLLER.path}/${bankPublicKey}${BANK_CONTROLLER.endpoints.asset}${PATH_PARAM.list}`);
  }

  getAssetPriceRecords(bankPublicKey: string): Observable<TokenPriceRecord[]> {
    return this.#http.get<TokenPriceRecord[]>(`${BANK_CONTROLLER.path}/${bankPublicKey}${BANK_CONTROLLER.endpoints.token}${PATH_PARAM.record}`);
  }

}
