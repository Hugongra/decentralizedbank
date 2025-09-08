import { Component, computed, DestroyRef, inject, Inject, signal, Signal } from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { first, firstValueFrom, tap } from 'rxjs';
import { AssetInputComponent } from '../../../components/asset-input/asset-input.component';
import { slideInLeft } from '../../../core/animations/slide';
import { WalletService } from '../../../services/wallet.service';
import { WithdrawSolInstruction, WithdrawTokenInstruction } from '../../../../smart-contract/states/deposit-state';
import { XInstruction } from '../../../../smart-contract/models/x-instruction';
import { LayoutService } from '../../../layout/layout.service';
import { Alert } from '../../../components/alert/alert.types';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { DepositData } from '../../../services/models/data/deposit-data';
import { PublicKey } from '@solana/web3.js';
import { BANK_PUBKEY, numberToBigint } from '../../../../smart-contract';
import { DataService } from '../../../services/data.service';


@Component({
  standalone: true,
  templateUrl: './withdraw-dialog.component.html',
  styleUrl: './withdraw-dialog.component.scss',
  imports: [
    MatIcon,
    MatIconButton,
    MatButton,
    MatProgressSpinner,
    AssetInputComponent
  ],
  animations: [slideInLeft]
})
export class WithdrawDialogComponent {

  #dialogRef = inject(MatDialogRef<WithdrawDialogComponent>);
  #destroyRef = inject(DestroyRef);
  #layoutService = inject(LayoutService);
  #walletService = inject(WalletService);
  #dataService = inject(DataService);

  #invertedS = signal<boolean>(false);
  loadingS = signal(true);
  depositDataS: Signal<DepositData>;
  amountS = signal<number>(0);
  maxS = computed(() => {
    if (this.#invertedS()) {
      return this.depositDataS().availableValue;
    } else {
      return this.depositDataS().availableAmount;
    }
  });

  constructor(@Inject(MAT_DIALOG_DATA) private _data: {depositPublicKey: PublicKey, assetPublicKey: PublicKey}) {
    this.depositDataS = toSignal(this.#dataService.fetchDepositData(this._data.depositPublicKey).pipe(takeUntilDestroyed(this.#destroyRef), tap(() => this.loadingS.set(false))));
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Public methods
  // -----------------------------------------------------------------------------------------------------

  close() {
    this.#dialogRef.close();
  }

  async withdraw() {
    const depositData = this.depositDataS();
    const assetState = await firstValueFrom(this.#dataService.fetchAssetState(depositData.depositAsset.publicKey));
    const amount = numberToBigint(this.amountS(), assetState.mintDecimals);
    let withdrawInstruction: XInstruction;
    if (assetState.native) {
      withdrawInstruction = new WithdrawSolInstruction(depositData.user, assetState.mintPubkey, assetState.representativeMintPubkey, BANK_PUBKEY, assetState.pubKey, depositData.publicKey, amount);
    } else {
      withdrawInstruction = new WithdrawTokenInstruction(depositData.user, assetState.mintPubkey, assetState.representativeMintPubkey, BANK_PUBKEY, assetState.pubKey, depositData.publicKey, amount);
    }
    const withdrawTransaction = withdrawInstruction.getTransaction();
    try {
      const txId = await this.#walletService.signTransaction(withdrawTransaction);
      this.#layoutService.addAlert(new Alert(`Withdraw transaction successful:
      ${txId.slice(0,4)}...${txId.slice(-4)}`, 'success'));
      this.#dataService.refreshAssetState(assetState.pubKey).pipe(first()).subscribe();
      this.#dataService.refreshDeposit(depositData.publicKey).pipe(first()).subscribe();
      this.close();
    } catch (error) {
      this.#layoutService.addAlert(new Alert('Withdraw transaction failed. Please try again', 'error'));
    }
  }

  onAmountChange(amount: number): void {
    this.amountS.set(amount);
  }

  onInvertChange(inverted: boolean): void {
    this.#invertedS.set(inverted);
  }

}

export function withdrawDialogConfigFactory(depositPublicKey: PublicKey, assetPublicKey: PublicKey) {
  return {
    height: '250px',
    maxWidth: '400px',
    width: '100%',
    data: {depositPublicKey, assetPublicKey}
  };
}
