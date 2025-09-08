import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, filter, first, firstValueFrom, forkJoin, from, map, mergeMap, switchMap, takeUntil, tap, timer } from 'rxjs';
import { PublicKey } from '@solana/web3.js';
import { WalletService } from './wallet.service';
import { BankState, CreateBankInstruction, UpdateBankInstruction } from '../../../smart-contract/states/bank-state';
import { AssetState, UpdateAssetInstruction, AssetConfig, CreateSolInstruction, CreateTokenInstruction, CreateTokenVaultsInstruction } from '../../../smart-contract/states/asset-state';
import { CONNECTION } from '../../../smart-contract';
import { ApiService } from '../api/api.service';
import { TokenPriceRecord } from '../api/models/token-price-record';

@Injectable({
  providedIn: 'root'
})
export class BankService {

  #walletService = inject(WalletService);
  #apiService = inject(ApiService);

  #bank$ = new BehaviorSubject<BankState | null>(null);
  #assets$ = new BehaviorSubject<{state: AssetState, meta: {tokenId: number, symbol: string, logoUrl: string}}[]>([]);
  #tokenPriceRecords$ = new BehaviorSubject<TokenPriceRecord[]>([]);

  constructor() {
    this.#walletService.publicKey$.pipe(
      filter((publicKey) => publicKey !== null),
      switchMap((publicKey) => {
        return this.getBankState(publicKey)
      }),
      tap((bank) => this.tokenPriceRecordsSubscription(bank.pubkey)),
      switchMap((bank) => this.#apiService.getBankAssets(bank.pubkey.toBase58()).pipe(
        filter((assets) => assets.length > 0),
        mergeMap((assets) =>
          forkJoin(assets.map((meta) =>
            this.getAssetState(new PublicKey(meta.publicKey)).pipe(map(state => ({state, meta})))
          ))
        )
      )),
      tap((assetsStates) => this.#assets$.next(assetsStates))
    ).subscribe();
  }

  get bank$() {
    return this.#bank$.asObservable();
  }

  get assets$() {
    return this.#assets$.asObservable();
  }

  get tokenPriceRecords$() {
    return this.#tokenPriceRecords$.asObservable();
  }

  async createBank(liquidator: PublicKey, feeVault: PublicKey): Promise<string> {
    const adminWallet = this.#walletService.publicKey;
    const instruction = new CreateBankInstruction(adminWallet, this.#bank$.getValue().pubkey, liquidator, feeVault);
    const txId = await this.#walletService.signTransaction(instruction.getTransaction());
    await firstValueFrom(this.getBankState(adminWallet));
    return txId;
  }

  async updateBank(liquidator?: PublicKey, feeVault?: PublicKey, resetDefcon?: boolean): Promise<string> {
    const adminWallet = this.#walletService.publicKey;
    const instruction = new UpdateBankInstruction(adminWallet, this.#bank$.getValue().pubkey, liquidator, feeVault, resetDefcon);
    const txId = await this.#walletService.signTransaction(instruction.getTransaction());
    await firstValueFrom(this.getBankState(adminWallet));
    return txId;
  }

  getAsset(assetPubKey: string) {
    return this.assets$.pipe(map((assets) => assets.find((asset) => asset.state.pubKey.toBase58() === assetPubKey)));
  }

  async createAsset(mintPubkey: PublicKey, representativeMintPubkey: PublicKey, assetConfig: AssetConfig): Promise<void> {
    const bankPubkey = this.#bank$.getValue().pubkey;
    let instruction;
    if (mintPubkey.equals(PublicKey.default)) {
      instruction = new CreateSolInstruction(this.#walletService.publicKey, mintPubkey, representativeMintPubkey, bankPubkey, assetConfig);
    } else {
      if (!await CONNECTION.getAccountInfo(AssetState.fetchReserveVaultPublicKey(bankPubkey, mintPubkey))) {
        const vaultInstruction = new CreateTokenVaultsInstruction(this.#walletService.publicKey, mintPubkey, representativeMintPubkey, bankPubkey);
        await this.#walletService.signTransaction(vaultInstruction.getTransaction());
      }
      instruction = new CreateTokenInstruction(this.#walletService.publicKey, mintPubkey, representativeMintPubkey, bankPubkey, assetConfig);
    }
    await this.#walletService.signTransaction(instruction.getTransaction());
  }

  async updateAsset(assetPubKey: PublicKey, assetConfig: AssetConfig): Promise<void> {
    const bankPubkey = this.#bank$.getValue().pubkey;
    const instruction = new UpdateAssetInstruction(bankPubkey, this.#walletService.publicKey, assetPubKey, assetConfig);
    await this.#walletService.signTransaction(instruction.getTransaction());
    this.getAssetState(assetPubKey).pipe(
      tap((lastState) => {
      const assets = this.#assets$.getValue();
      const index = assets.findIndex((asset) => asset.state.pubKey.equals(assetPubKey));
      assets[index].state = lastState;
      this.#assets$.next(assets);
    })
    ).subscribe();
  }

  private getBankState(adminPubkey: PublicKey): Observable<BankState> {
    return from(BankState.factory(adminPubkey)).pipe(
      tap((bank) => this.#bank$.next(bank))
    )
  }

  private getAssetState(assetPubKey: PublicKey): Observable<AssetState> {
    return from(CONNECTION.getAccountInfo(assetPubKey)).pipe(
      first(),
      map((accountInfo) => {
        return new AssetState(assetPubKey, accountInfo);
      })
    );
  };

  private tokenPriceRecordsSubscription(bankPubkey: PublicKey) {
    timer(0, 60000).pipe(
      takeUntil(this.#bank$.pipe(filter(bank => bank === null))),
      switchMap(() => this.#apiService.getAssetPriceRecords(bankPubkey.toBase58())),
      tap(records => this.#tokenPriceRecords$.next(records))
    ).subscribe();
  }

}
