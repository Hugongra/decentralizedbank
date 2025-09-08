import { Component, computed, DestroyRef, inject, Inject, signal, Signal } from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { BehaviorSubject, filter, firstValueFrom, map, switchMap } from 'rxjs';
import { PublicKey } from '@solana/web3.js';
import { AssetInputComponent } from '../asset-input/asset-input.component';
import { NumberFormatterPipe } from '../../pipes/number-formatter.pipe';
import { slideInLeft } from '../../core/animations/slide';
import { LayoutService } from '../../layout/layout.service';
import { WalletService } from '../../services/wallet.service';
import { BANK_PUBKEY, bpsToPercent, numberToBigint } from '../../../smart-contract';
import { BorrowSolInstruction, BorrowState, BorrowTokenInstruction } from '../../../smart-contract/states/borrow-state';
import { XInstruction } from '../../../smart-contract/models/x-instruction';
import { TokenAccount } from '../../../smart-contract/models/vault-account';
import { AssetState } from '../../../smart-contract/states/asset-state';
import { Alert } from '../alert/alert.types';
import { Asset } from '../../services/models/api/asset';
import { DataService } from '../../services/data.service';


@Component({
  templateUrl: './borrow-dialog.component.html',
  imports: [
    MatIcon,
    MatIconButton,
    MatButton,
    MatProgressSpinner,
    AssetInputComponent,
    NumberFormatterPipe
  ],
  animations: [slideInLeft]
})
export class BorrowDialogComponent {

  #destroyRef = inject(DestroyRef);
  #dialogRef = inject(MatDialogRef<BorrowDialogComponent>);
  #layoutService = inject(LayoutService);
  #walletService = inject(WalletService);
  #dataService = inject(DataService);

  #depositPublicKey$ = new BehaviorSubject<PublicKey | null>(null);

  borrowAssetS: Signal<Asset>;
  borrowAssetStateS: Signal<AssetState>;
  borrowPriceS: Signal<number>;

  depositDataS = toSignal(this.#depositPublicKey$.pipe(
    filter(pubKey => !!pubKey),
    switchMap(pubKey => this.#dataService.fetchDepositData(pubKey))
  ));
  #depositAssetStateS = toSignal(this.#depositPublicKey$.pipe(
    filter(pubKey => !!pubKey),
    switchMap(pubKey => this.#dataService.fetchDepositState(pubKey)),
    switchMap(deposit => this.#dataService.fetchAssetState(deposit.asset))
  ));

  loadingS = signal(true);
  amountS = signal<number>(0);
  invertedS = signal(false);
  borrowDataS: Signal<{symbol: string, price: number, decimals: number}>;
  depositDataListS = toSignal(this.#dataService.deposits$.pipe(takeUntilDestroyed(this.#destroyRef)));
  maxS = computed(() => {
    const ltv = bpsToPercent(this.borrowAssetStateS().config.openLtv)/100;
    const bw = bpsToPercent(this.#depositAssetStateS().config.borrowWeight)/100;
    const maxBorrowValue = ltv * this.depositDataS().availableAmount * this.depositDataS().depositAsset.price * bw;
    if (this.invertedS()) {
      return maxBorrowValue;
    } else {
      return maxBorrowValue / this.borrowPriceS();
    }
  });
  animation: boolean = true;

  constructor(@Inject(MAT_DIALOG_DATA) private _data: {borrowAssetPublicKey: PublicKey, depositPublicKey?: PublicKey}) {
    this.borrowAssetStateS = toSignal(this.#dataService.fetchAssetState(this._data.borrowAssetPublicKey).pipe(takeUntilDestroyed(this.#destroyRef)));
    this.borrowAssetS = toSignal(this.#dataService.fetchAsset(this._data.borrowAssetPublicKey).pipe(takeUntilDestroyed(this.#destroyRef)));
    this.borrowPriceS = toSignal(this.#dataService.fetchAsset(this._data.borrowAssetPublicKey).pipe(
      takeUntilDestroyed(this.#destroyRef),
      switchMap(asset => this.#dataService.fetchTokenPriceRecord(asset.tokenId)),
      map(priceRecord => priceRecord?.price || 0)
    ));
    if (this._data.depositPublicKey) {
      this.animation = false;
      this.#depositPublicKey$.next(this._data.depositPublicKey);
    }
    this.loadingS.set(false);
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Public methods
  // -----------------------------------------------------------------------------------------------------

  close() {
    this.#dialogRef.close();
  }

  selectCollateral(depositStatePubKey: PublicKey) {
    this.#depositPublicKey$.next(depositStatePubKey);
  }

  async borrow() {
    const userWalletPubKey = await firstValueFrom(this.#walletService.publicKey$);
    const borrowAssetState = this.borrowAssetStateS();
    const depositAssetState = this.#depositAssetStateS();
    const borrowPrice = this.borrowPriceS();
    const borrowPubkey = BorrowState.fetchPublicKey(userWalletPubKey, borrowAssetState.pubKey, depositAssetState.pubKey);
    const depositState = this.depositDataS();
    const reserveVaultPubkey = AssetState.fetchReserveVaultPublicKey(BANK_PUBKEY, borrowAssetState.mintPubkey);
    const collateralVaultPubkey = TokenAccount.fetchPublicKey(BANK_PUBKEY, depositAssetState.representativeMintPubkey);
    const depositVaultPubkey = TokenAccount.fetchPublicKey(userWalletPubKey, depositAssetState.representativeMintPubkey);
    const depositPrice = this.depositDataS().depositAsset.price;
    let borrowInstruction: XInstruction;
    if (borrowAssetState.native) {
      borrowInstruction = new BorrowSolInstruction(
        userWalletPubKey,
        BANK_PUBKEY,
        borrowAssetState.pubKey, 
        depositAssetState.pubKey,
        borrowPubkey,
        depositState.publicKey,
        reserveVaultPubkey,
        collateralVaultPubkey,
        depositVaultPubkey,
        numberToBigint(this.amountS(), borrowAssetState.mintDecimals),
        borrowPrice,
        depositPrice
      );
    } else {
      const userTokenReservePubkey = TokenAccount.fetchPublicKey(userWalletPubKey, borrowAssetState.mintPubkey);
      borrowInstruction = new BorrowTokenInstruction(
        userWalletPubKey,
        BANK_PUBKEY,
        borrowAssetState.pubKey, 
        depositAssetState.pubKey,
        borrowPubkey,
        depositState.publicKey,
        reserveVaultPubkey,
        collateralVaultPubkey,
        depositVaultPubkey,
        userTokenReservePubkey,
        numberToBigint(this.amountS(), borrowAssetState.mintDecimals),
        borrowPrice,
        depositPrice
      );
    }
    const borrowTransaction = borrowInstruction.getTransaction();
    try {
      const txId = await this.#walletService.signTransaction(borrowTransaction);
      this.#layoutService.addAlert(new Alert(`Borrow transaction successful:
      ${txId.slice(0,4)}...${txId.slice(-4)}`, 'success'));
      this.#dataService.refreshAssetState(borrowAssetState.pubKey).subscribe();
      this.#dataService.refreshAssetState(depositAssetState.pubKey).subscribe();
      this.#dataService.refreshBorrow(borrowPubkey).subscribe();
      this.#dataService.refreshDeposit(depositState.publicKey).subscribe();
      this.close();
    } catch (error) {
      this.#layoutService.addAlert(new Alert('Borrow transaction failed. Please try again', 'error'));
    }
  }

  onAmountChange(amount: number): void {
    this.amountS.set(amount);
  }

  onInvertedChange(inverted: boolean): void {
    this.invertedS.set(inverted);
  }

}

export function borrowDialogConfigFactory(borrowAssetPublicKey: PublicKey, depositPublicKey?: PublicKey) {
  return {
    height: '250px',
    maxWidth: '400px',
    width: '100%',
    data: {
      borrowAssetPublicKey,
      depositPublicKey
    }
  };
}
