import { Component, inject } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatDialogRef } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { WalletType } from '../wallet-types';

@Component({
  standalone: true,
  templateUrl: './wallet-dialog.component.html',
  styleUrl: './wallet-dialog.component.scss',
  imports: [
    MatIcon,
    MatIconButton
  ],
})
export class WalletsDialogComponent {

  #dialogRef = inject(MatDialogRef<WalletsDialogComponent>);

  WalletType = WalletType;

  selectWallet(walletType: WalletType): void {
    this.#dialogRef.close(walletType);
  }

  close() {
    this.#dialogRef.close();
  }

}
