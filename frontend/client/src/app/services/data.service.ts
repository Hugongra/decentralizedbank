import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, catchError, combineLatest, filter, forkJoin, from, map, mergeMap, of, shareReplay, switchMap, takeUntil, tap, timer } from 'rxjs';
import { PublicKey } from '@solana/web3.js';
import { WalletService } from './wallet.service';
import { ApiService } from './api.service';
import { BANK_PUBKEY } from '../../smart-contract';
import { DepositState } from '../../smart-contract/states/deposit-state';
import { BorrowState } from '../../smart-contract/states/borrow-state';
import { BankState } from '../../smart-contract/states/bank-state';
import { AssetState } from '../../smart-contract/states/asset-state';
import { Asset } from './models/api/asset';
import { TokenPriceRecord } from './models/api/token-price-record';
import { BorrowData } from './models/data/borrow-data';
import { DepositData } from './models/data/deposit-data';
import { SystemAccount, TokenAccount, VaultAccount } from '../../smart-contract/models/vault-account';
import { AssetData } from './models/data/asset-data';


@Injectable({
  providedIn: 'root'
})
export class DataService {

  #walletService = inject(WalletService);
  #apiService = inject(ApiService);

  #bankState$ = new BehaviorSubject<BankState | null>(null);
  #assetStates$ = new BehaviorSubject<AssetState[]>([]);
  #assetsVaults$ = new BehaviorSubject<VaultAccount[]>([]);
  #userVaults$ = new BehaviorSubject<VaultAccount[]>([]);
  #depositStates$ = new BehaviorSubject<DepositState[]>([]);
  #borrowStates$ = new BehaviorSubject<BorrowState[]>([]);
  
  #assets$ = new BehaviorSubject<Asset[]>([]);
  #tokenPriceRecords$ = new BehaviorSubject<TokenPriceRecord[]>([]);

  constructor() {
    // Assets
    from(BankState.from(BANK_PUBKEY)).pipe(
      map((bank) => {
        if (bank === null) {
          return null;
        }
        return bank;
      }),
      tap((bank) => {
        this.#bankState$.next(bank);
        this.bankRefreshSubscription();
        this.tokenPriceRecordsRefreshSubscription();
      }),
      filter((bank) => bank !== null),
      switchMap((bank) => this.#apiService.getBankAssets(bank.pubkey.toBase58()).pipe(
        catchError(() => of([] as Asset[]))
      )),
      tap((assets) => {
        this.#assets$.next(assets);
        this.assetsRefreshSubscription();
      }),
      filter((assets) => assets.length > 0),
      mergeMap((assets) =>
        forkJoin(assets.map((asset) =>
          from(AssetState.from(new PublicKey(asset.publicKey))))
        )
      ),
      filter((assetStates) => assetStates.length > 0),
      tap((assetStates) => {
        this.#assetStates$.next(assetStates);
        this.assetStatesRefreshSubscription();
      })
    ).subscribe();
    // Asset Vaults
    this.#assetStates$.pipe(
      mergeMap((assetStates) => {
        return forkJoin(assetStates.flatMap((assetState) => {
          if (assetState.native) {
            return [
              from(SystemAccount.from(AssetState.fetchReserveVaultPublicKey(BANK_PUBKEY, assetState.mintPubkey))),
              from(TokenAccount.from(AssetState.fetchCollateralVaultPublicKey(BANK_PUBKEY, assetState.representativeMintPubkey), assetState.mintPubkey)),
            ];
          } else {
            return [
              from(TokenAccount.from(AssetState.fetchReserveVaultPublicKey(BANK_PUBKEY, assetState.mintPubkey), assetState.mintPubkey)),
              from(TokenAccount.from(AssetState.fetchCollateralVaultPublicKey(BANK_PUBKEY, assetState.representativeMintPubkey), assetState.mintPubkey)),
            ];
          }
        }))
      }),
      tap((vaults) => this.#assetsVaults$.next(vaults))
    )
    .subscribe();
    // User Vaults
    combineLatest([this.#walletService.publicKey$, this.#assetStates$]).pipe(
      mergeMap(([pubKey, assetStates]) => {
        if (pubKey === null || assetStates.length === 0) {
          return of([] as VaultAccount[]);
        }
        return forkJoin(assetStates.flatMap((assetState) => {
          if (assetState.native) {
            return [
              from(SystemAccount.from(pubKey)),
              from(TokenAccount.factory(pubKey, assetState.representativeMintPubkey))
            ];
          } else {
            return [
              from(TokenAccount.factory(pubKey, assetState.mintPubkey)),
              from(TokenAccount.factory(pubKey, assetState.representativeMintPubkey))
            ];
          }
        }))
      }),
      tap((vaults) => this.#userVaults$.next(vaults))
    )
    .subscribe();
    // Deposits
    this.#walletService.publicKey$.pipe(
      switchMap((pubKey) => {
        if (pubKey === null) {
          return of([] as PublicKey[]);
        }
        return this.#apiService.getUserDeposits(BANK_PUBKEY.toBase58(), pubKey.toBase58()).pipe(catchError(() => of([] as PublicKey[])));
      }),
      mergeMap((publicKeys) => {
        if (publicKeys.length === 0) {
          return of([] as DepositState[]);
        }
        return forkJoin(publicKeys.map((publicKey) => from(DepositState.from(publicKey))));
      }),
      tap((states) => this.#depositStates$.next(states))
    )
    .subscribe();
    // Borrows
    this.#walletService.publicKey$.pipe(
      switchMap((pubKey) => {
        if (pubKey === null) {
          return of([] as PublicKey[]);
        }
        return this.#apiService.getUserBorrows(BANK_PUBKEY.toBase58(), pubKey.toBase58()).pipe(catchError(() => of([] as PublicKey[])));
      }),
      mergeMap((publicKeys) => {
        if (publicKeys.length === 0) {
          return of([] as BorrowState[]);
        }
        return forkJoin(publicKeys.map((publicKey) => from(BorrowState.from(publicKey))));
      }),
      tap((states) => this.#borrowStates$.next(states))
    )
    .subscribe();
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Accessors
  // -----------------------------------------------------------------------------------------------------

  get active$(): Observable<boolean> {
    return combineLatest([this.#bankState$, this.assetStates$]).pipe(
      map(([bank, assetStates]) => bank !== null && bank.defcon > 1 && assetStates.length > 0)
    );
  }

  get bankState$(): Observable<BankState> {
    return this.#bankState$.pipe(shareReplay(1));
  }

  get assetStates$(): Observable<AssetState[]> {
    return this.#assetStates$.pipe(shareReplay(1));
  }

  get assets$(): Observable<AssetData[]> {
    return combineLatest([
      this.#assetStates$,
      this.#assets$,
      this.#assetsVaults$,
      this.#tokenPriceRecords$,
    ]).pipe(
      filter(([assetStates, assets, assetsVaults, tokenPriceRecords]) => assetStates.length > 0 && assets.length > 0 && assetsVaults.length > 0 && tokenPriceRecords.length > 0),
      shareReplay(1),
      map(([assetStates, assets, vaults, tokenPriceRecords]) => {
        return assetStates.map((assetState) => {
          const asset = assets.find((asset) => asset.publicKey === assetState.pubKey.toBase58());
          console.log(vaults.map(vault => vault.pubKey.toBase58()));
          console.log(AssetState.fetchReserveVaultPublicKey(BANK_PUBKEY, assetState.mintPubkey).toBase58()),
          console.log(AssetState.fetchCollateralVaultPublicKey(BANK_PUBKEY, assetState.representativeMintPubkey).toBase58());
          const reserveVault = vaults.find((vault) => vault.pubKey.equals(AssetState.fetchReserveVaultPublicKey(BANK_PUBKEY, assetState.mintPubkey)));
          const collateralVault = vaults.find((vault) => vault.pubKey.equals(AssetState.fetchCollateralVaultPublicKey(BANK_PUBKEY, assetState.representativeMintPubkey)));
          const price = tokenPriceRecords.find((record) => record.tokenId === asset.tokenId)?.price || 0;
          return new AssetData(assetState, asset, price, reserveVault, collateralVault);
        });
      })
    )
  }

  get deposited$(): Observable<boolean> {
    return this.#depositStates$.asObservable().pipe(
      shareReplay(1),
      map((deposits) => deposits.filter(deposit => deposit.amount > 0).length > 0)
    );
  }

  get deposits$(): Observable<DepositData[]> {
    return combineLatest([
      this.#depositStates$,
      this.#assetStates$,
      this.#assets$,
      this.#tokenPriceRecords$,
      this.#userVaults$
    ]).pipe(
      shareReplay(1),
      map(([depositStates, assetStates, assets, tokenPriceRecords, userVaults]) => {
        return depositStates.filter(state => state.amount > 0).map((depositState) => {
          const assetState = assetStates.find((state) => state.pubKey.equals(depositState.asset));
          const asset = assets.find((asset) => asset.publicKey === depositState.asset.toBase58());
          const price = tokenPriceRecords.find((record) => record.tokenId === asset.tokenId)?.price || 0;
          const depositVault = userVaults.find((vault) => vault.mint.equals(assetState.representativeMintPubkey));
          return new DepositData(depositState, assetState, asset, price, depositVault);
        });
      })
    );
  }

  get borrowed$(): Observable<boolean> {
    return this.#borrowStates$.asObservable().pipe(
      shareReplay(1),
      map((borrows) => borrows.filter(state => state.amount > 0).length > 0)
    );
  }

  get borrows$(): Observable<BorrowData[]> {
    return combineLatest([
      this.#borrowStates$,
      this.#depositStates$,
      this.#assetStates$,
      this.#assets$,
      this.#tokenPriceRecords$
    ]).pipe(
      shareReplay(1),
      map(([borrowStates, depositStates, assetStates, assets, tokenPriceRecords]) => {
        return borrowStates.filter(state => state.amount > 0 ).map((borrowState) => {
          const borrowAssetState = assetStates.find((state) => state.pubKey.equals(borrowState.asset));
          const depositState = depositStates.find((state) => state.pubKey.equals(borrowState.deposit));
          const collateralAssetState = assetStates.find((state) => state.pubKey.equals(depositState.asset));
          const borrowAsset = assets.find((asset) => asset.publicKey === borrowState.asset.toBase58());
          const collateralAsset = assets.find((asset) => asset.publicKey === depositState.asset.toBase58());
          const borrowPrice = tokenPriceRecords.find((record) => record.tokenId === borrowAsset.tokenId)?.price || 0;
          const collateralPrice = tokenPriceRecords.find((record) => record.tokenId === collateralAsset.tokenId)?.price || 0;
          return new BorrowData(borrowState, borrowAssetState, collateralAssetState, borrowAsset, collateralAsset, borrowPrice, collateralPrice);
        });
      })
    );
  }

  get assetsMap$(): Observable<Map<string, Asset>> {
    return this.#assets$.pipe(
      map(assets => new Map(assets.map(asset => [asset.publicKey, asset]))),
      shareReplay(1)
    );
  }

  get tokenPriceRecordsMap$(): Observable<Map<number, TokenPriceRecord>> {
    return this.#tokenPriceRecords$.pipe(
      map(records => new Map(records.map(record => [record.tokenId, record]))),
      shareReplay(1)
    );
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Public methods
  // -----------------------------------------------------------------------------------------------------

  fetchAssetState(pubKey: PublicKey): Observable<AssetState> {
    return this.assetStates$.pipe(
      map((assetStates) => assetStates.find((state) => state.pubKey.equals(pubKey)))
    );
  }

  fetchAssetData(pubKey: PublicKey): Observable<AssetData> {
    return this.assets$.pipe(
      map((assetStates) => assetStates.find((state) => state.publicKey.equals(pubKey)))
    );
  }

  refreshAssetState(pubKey: PublicKey): Observable<AssetState> {
    return from(AssetState.from(pubKey)).pipe(
      tap((assetState) => {
        const assetStates = this.#assetStates$.getValue();
        const index = assetStates.findIndex((state) => state.pubKey.equals(pubKey));
        assetStates[index] = assetState;
        this.#assetStates$.next(assetStates);
      })
    );
  }

  fetchDepositState(publicKey: PublicKey): Observable<DepositState> {
    return this.#depositStates$.pipe(
      map((states) => states.find((state) => state.pubKey.equals(publicKey)))
    );
  }

  fetchDepositData(publicKey: PublicKey): Observable<DepositData> {
    return this.deposits$.pipe(
      map((states) => states.find((state) => state.publicKey.equals(publicKey)))
    );
  }

  refreshDeposit(pubKey: PublicKey): Observable<DepositState> {
    return from(DepositState.from(pubKey)).pipe(
      tap((state) => {
        const states = this.#depositStates$.value;
        const index = states.findIndex((state) => state.pubKey.equals(pubKey));
        if (index === -1) {
          states.push(state);
        }
        else {
          states[index] = state;
          this.#depositStates$.next(states);
        }
      }
    ));
  }

  fetchBorrowData(publicKey: PublicKey): Observable<BorrowData> {
    return this.borrows$.pipe(
      map((borrows) => borrows.find((borrow) => borrow.publicKey.equals(publicKey)))
    );
  }

  refreshBorrow(pubKey: PublicKey): Observable<BorrowState> {
    return from(BorrowState.from(pubKey)).pipe(
      tap((state) => {
        const states = this.#borrowStates$.value;
        const index = states.findIndex((state) => state.pubKey.equals(pubKey));
        if (index === -1) {
          states.push(state);
        }
        else {
          states[index] = state;
        }
        this.#borrowStates$.next(states);
      }
    ));
  }

  fetchAsset(pubKey: PublicKey): Observable<Asset> {
    return this.assetsMap$.pipe(
      map((assetsMap) => assetsMap.get(pubKey.toBase58()))
    );
  }

  fetchTokenPriceRecord(tokenId: number): Observable<TokenPriceRecord> {
    return this.tokenPriceRecordsMap$.pipe(
      map((records) => records.get(tokenId))
    );
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Private methods
  // -----------------------------------------------------------------------------------------------------

  private bankRefreshSubscription() {
    timer(60000).pipe(
      takeUntil(this.#bankState$.pipe(filter(bank => bank === null))),
      switchMap(() => from(BankState.from(BANK_PUBKEY))),
      tap((bank) => this.#bankState$.next(bank)),
    ).subscribe();
  }

  private assetsRefreshSubscription() {
    timer(600000).pipe(
      takeUntil(this.#bankState$.pipe(filter(bank => bank === null))),
      switchMap(() => this.#bankState$.asObservable()),
      switchMap((bank) => this.#apiService.getBankAssets(bank.pubkey.toBase58())),
      tap((assets) => this.#assets$.next(assets)),
    ).subscribe();
  }

  private assetStatesRefreshSubscription() {
    timer(60000).pipe(
      takeUntil(this.#bankState$.pipe(filter(bank => bank === null))),
      switchMap(() => this.#assets$.asObservable()),
      mergeMap((assets) =>
        forkJoin(assets.map((asset) =>
          from(AssetState.from(new PublicKey(asset.publicKey))))
        )
      ),
      tap((assetStates) => this.#assetStates$.next(assetStates)),
    ).subscribe();
  }

  private tokenPriceRecordsRefreshSubscription() {
    timer(0, 60000).pipe(
      takeUntil(this.#bankState$.pipe(filter(bank => bank === null))),
      switchMap(() => this.#bankState$.asObservable()),
      switchMap((bank) => this.#apiService.getTokenPriceRecords(bank.pubkey.toBase58())),
      tap(records => this.#tokenPriceRecords$.next(records))
    ).subscribe();
  }

}
