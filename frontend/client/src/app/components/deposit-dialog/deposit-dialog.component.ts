import { Component, computed, DestroyRef, inject, Inject, signal, Signal } from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { firstValueFrom, map, switchMap } from 'rxjs';
import { PublicKey } from '@solana/web3.js';
import { AssetInputComponent } from '../asset-input/asset-input.component';
import { slideInLeft } from '../../core/animations/slide';
import { LayoutService } from '../../layout/layout.service';
import { WalletService } from '../../services/wallet.service';
import { CreateDepositInstruction, DepositSolInstruction, DepositState, DepositTokenInstruction } from '../../../smart-contract/states/deposit-state';
import { XInstruction } from '../../../smart-contract/models/x-instruction';
import { Alert } from '../alert/alert.types';
import { BANK_PUBKEY, bigintToNumber, numberToBigint } from '../../../smart-contract';
import { AssetState } from '../../../smart-contract/states/asset-state';
import { Asset } from '../../services/models/api/asset';
import { SystemAccount, TokenAccount, VaultAccount } from '../../../smart-contract/models/vault-account';
import { DataService } from '../../services/data.service';

@Component({
  templateUrl: './deposit-dialog.component.html',
  imports: [
    MatIcon,
    MatIconButton,
    MatButton,
    MatProgressSpinner,
    AssetInputComponent
  ],
  animations: [slideInLeft]
})
export class DepositDialogComponent {

  #dialogRef = inject(MatDialogRef<DepositDialogComponent>);
  #destroyRef = inject(DestroyRef);
  #layoutService = inject(LayoutService);
  #walletService = inject(WalletService);
  #dataService = inject(DataService);

  #userReserveVaultS: Signal<VaultAccount>;
  assetStateS: Signal<AssetState>;
  assetS: Signal<Asset>;
  priceS: Signal<number>;
  loadingS = signal(true);
  invertedS = signal(false);
  depositStateS: Signal<DepositState>;
  amountS = signal<number>(0);
  maxS = computed(() => {
    const amount = bigintToNumber(this.#userReserveVaultS().amount, this.assetStateS().mintDecimals);
    if (this.invertedS()) {
      return amount * this.priceS();
    } else {
      return amount;
    }
  })
  animation = true;

  constructor(@Inject(MAT_DIALOG_DATA) private _assetPubkey: PublicKey) {
    this.assetStateS = toSignal(this.#dataService.fetchAssetState(this._assetPubkey).pipe(takeUntilDestroyed(this.#destroyRef)));
    this.assetS = toSignal(this.#dataService.fetchAsset(this._assetPubkey).pipe(takeUntilDestroyed(this.#destroyRef)));
    this.priceS = toSignal(this.#dataService.fetchAsset(this._assetPubkey).pipe(
      takeUntilDestroyed(this.#destroyRef),
      switchMap(asset => this.#dataService.fetchTokenPriceRecord(asset.tokenId)),
      map(priceRecord => priceRecord.price)
    ));
    this.initDepositData(this._assetPubkey);
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Public methods
  // -----------------------------------------------------------------------------------------------------

  close() {
    this.#dialogRef.close();
  }

  async createDeposit() {
    const userWalletPubKey = await firstValueFrom(this.#walletService.publicKey$);
    const assetState = await firstValueFrom(this.#dataService.fetchAssetState(this._assetPubkey));
    const createDepositVaultInstruction = new CreateDepositInstruction(userWalletPubKey, assetState.representativeMintPubkey, BANK_PUBKEY, assetState.pubKey);
    const createDepositVaultInstructionTransaction = createDepositVaultInstruction.getTransaction();
    try {
      const txId = await this.#walletService.signTransaction(createDepositVaultInstructionTransaction);
      this.#layoutService.addAlert(new Alert(`Created Deposit Account successful:
      ${txId.slice(0,4)}...${txId.slice(-4)}`, 'success'));
      const deposit = await DepositState.factory(this._assetPubkey, this.#walletService.publicKey);
      this.#dataService.refreshDeposit(deposit.pubKey).subscribe();
      this.depositStateS = signal(deposit);
    } 
    catch (error) {
      console.error(error);
    }
  }

  async deposit() {
    const userWalletPubKey = await firstValueFrom(this.#walletService.publicKey$);
    const depositState = this.depositStateS();
    const assetState = await firstValueFrom(this.#dataService.fetchAssetState(this._assetPubkey));
    let depositInstruction: XInstruction;
    if (assetState.native) {
      depositInstruction = new DepositSolInstruction(
        userWalletPubKey,
        assetState.mintPubkey,
        assetState.representativeMintPubkey,
        assetState.bank,
        assetState.pubKey,
        depositState.pubKey,
        numberToBigint(this.amountS(), assetState.mintDecimals)
      );
    } else {
      depositInstruction = new DepositTokenInstruction(
        userWalletPubKey,
        assetState.mintPubkey,
        assetState.representativeMintPubkey,
        assetState.bank,
        assetState.pubKey,
        depositState.pubKey,
        numberToBigint(this.amountS(), assetState.mintDecimals)
      );
    }
    const depositTransaction = depositInstruction.getTransaction();
    try {
      const txId = await this.#walletService.signTransaction(depositTransaction);
      this.#layoutService.addAlert(new Alert(`Deposit transaction successful:
      ${txId.slice(0,4)}...${txId.slice(-4)}`, 'success'));
      this.#dataService.refreshAssetState(assetState.pubKey).subscribe();
      this.#dataService.refreshDeposit(depositState.pubKey).subscribe();
      this.close();
    } catch (error) {
      this.#layoutService.addAlert(new Alert('Deposit transaction failed. Please try again', 'error'));
    }
  }

  onAmountChange(amount: number): void {
    this.amountS.set(amount);
  }

  onInvertedChange(inverted: boolean): void {
    this.invertedS.set(inverted);
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Private methods
  // -----------------------------------------------------------------------------------------------------

  private async initDepositData(assetPubkey: PublicKey) {
    const userWalletPubKey = await firstValueFrom(this.#walletService.publicKey$);
    const assetState = await firstValueFrom(this.#dataService.fetchAssetState(assetPubkey));
    const depositState = await DepositState.factory(assetPubkey, userWalletPubKey);
    this.animation = !depositState.init;
    this.depositStateS = signal(depositState);
    if (assetState.native) {
      this.#userReserveVaultS = signal(await SystemAccount.from(userWalletPubKey));
    } else {
      this.#userReserveVaultS = signal(await TokenAccount.factory(userWalletPubKey, assetState.mintPubkey));
    }
    this.loadingS.set(false);
  }

}

export function depositDialogConfigFactory(asset: PublicKey) {
  return {
    height: '250px',
    maxWidth: '400px',
    width: '100%',
    data: asset
  };
}
