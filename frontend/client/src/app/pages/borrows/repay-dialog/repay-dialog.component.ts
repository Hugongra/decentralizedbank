import { Component, computed, DestroyRef, inject, Inject, signal, Signal } from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { firstValueFrom, tap } from 'rxjs';
import { AssetInputComponent } from '../../../components/asset-input/asset-input.component';
import { slideInLeft } from '../../../core/animations/slide';
import { WalletService } from '../../../services/wallet.service';
import { RepaySolInstruction, RepayTokenInstruction } from '../../../../smart-contract/states/borrow-state';
import { XInstruction } from '../../../../smart-contract/models/x-instruction';
import { LayoutService } from '../../../layout/layout.service';
import { Alert } from '../../../components/alert/alert.types';
import { PublicKey } from '@solana/web3.js';
import { DepositState } from '../../../../smart-contract/states/deposit-state';
import { AssetState } from '../../../../smart-contract/states/asset-state';
import { TokenAccount } from '../../../../smart-contract/models/vault-account';
import { BANK_PUBKEY, numberToBigint } from '../../../../smart-contract';
import { DataService } from '../../../services/data.service';
import { BorrowData } from '../../../services/models/data/borrow-data';


@Component({
  standalone: true,
  templateUrl: './repay-dialog.component.html',
  styleUrl: './repay-dialog.component.scss',
  imports: [
    MatIcon,
    MatIconButton,
    MatButton,
    MatProgressSpinner,
    AssetInputComponent
  ],
  animations: [slideInLeft]
})
export class RepayDialogComponent {

  #destroyRef = inject(DestroyRef);
  #dialogRef = inject(MatDialogRef<RepayDialogComponent>);
  #layoutService = inject(LayoutService);
  #walletService = inject(WalletService);
  #dataService = inject(DataService);

  #invertedS = signal<boolean>(false);

  loadingS = signal(true);
  borrowDataS: Signal<BorrowData>;
  amountS = signal<number>(0);
  maxS = computed(() => {
    if (this.#invertedS()) {
      return this.borrowDataS().owedValue;
    } else {
      return this.borrowDataS().owedAmount;
    }
  });

  constructor(@Inject(MAT_DIALOG_DATA) private _borrowPublicKey: PublicKey) {
    this.borrowDataS = toSignal(this.#dataService.fetchBorrowData(this._borrowPublicKey).pipe(takeUntilDestroyed(this.#destroyRef), tap(() => this.loadingS.set(false))));
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Public methods
  // -----------------------------------------------------------------------------------------------------

  close() {
    this.#dialogRef.close();
  }

  async repay() {
    const borrowData = this.borrowDataS();
    const userWalletPubKey = await firstValueFrom(this.#walletService.publicKey$);
    const bankState = await firstValueFrom(this.#dataService.bankState$);
    const borrowAssetState = await firstValueFrom(this.#dataService.fetchAssetState(borrowData.borrowAsset.publicKey));
    const depositAssetState = await firstValueFrom(this.#dataService.fetchAssetState(borrowData.collateralAsset.publicKey));
    const depositPubkey = DepositState.fetchPubKey(depositAssetState.pubKey, userWalletPubKey);
    const reserveVaultPubkey = AssetState.fetchReserveVaultPublicKey(BANK_PUBKEY, borrowAssetState.mintPubkey);
    const collateralVaultPubkey = TokenAccount.fetchPublicKey(BANK_PUBKEY, depositAssetState.representativeMintPubkey);
    const depositVaultPubkey = TokenAccount.fetchPublicKey(userWalletPubKey, depositAssetState.representativeMintPubkey);
    const feeVaultPubkey = borrowAssetState.native ? bankState.feeVault : TokenAccount.fetchPublicKey(bankState.feeVault, borrowAssetState.mintPubkey);
    const amount = borrowData.cleanRepayAmount(this.amountS());
    let repayInstruction: XInstruction;
    if (borrowAssetState.native) {
      repayInstruction = new RepaySolInstruction(
        userWalletPubKey,
        BANK_PUBKEY,
        borrowAssetState.pubKey, 
        depositAssetState.pubKey,
        borrowData.publicKey,
        depositPubkey,
        reserveVaultPubkey,
        collateralVaultPubkey,
        depositVaultPubkey,
        feeVaultPubkey,
        amount
      );
    } else {
      const userTokenReservePubkey = TokenAccount.fetchPublicKey(userWalletPubKey, borrowAssetState.mintPubkey);
      repayInstruction = new RepayTokenInstruction(
        userWalletPubKey,
        BANK_PUBKEY,
        borrowAssetState.pubKey, 
        depositAssetState.pubKey,
        borrowData.publicKey,
        depositPubkey,
        reserveVaultPubkey,
        collateralVaultPubkey,
        depositVaultPubkey,
        userTokenReservePubkey,
        feeVaultPubkey,
        amount
      );
    }
    const repayTransaction = repayInstruction.getTransaction();
    try {
      const txId = await this.#walletService.signTransaction(repayTransaction);
      this.#layoutService.addAlert(new Alert(`Repay transaction successful:
      ${txId.slice(0,4)}...${txId.slice(-4)}`, 'success'));
      this.#dataService.refreshAssetState(borrowAssetState.pubKey).subscribe();
      this.#dataService.refreshAssetState(depositAssetState.pubKey).subscribe();
      this.#dataService.refreshDeposit(depositPubkey).subscribe();
      this.#dataService.refreshBorrow(borrowData.publicKey).subscribe();
      this.close();
    } catch (error) {
      this.#layoutService.addAlert(new Alert('Repay transaction failed. Please try again', 'error'));
    }
  }

  onAmountChange(amount: number): void {
    this.amountS.set(amount);
  }

  onInvertChange(inverted: boolean): void {
    this.#invertedS.set(inverted);
  }

}

export function repayDialogConfigFactory(borrowPublicKey: PublicKey) {
  return {
    height: '250px',
    maxWidth: '400px',
    width: '100%',
    data: borrowPublicKey
  };
}
