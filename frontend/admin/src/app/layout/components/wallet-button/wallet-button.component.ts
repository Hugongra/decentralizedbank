import { Component, EventEmitter, inject, input, Output } from '@angular/core';
import { MatFabButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { WalletsDialogComponent } from './wallet-dialog/wallet-dialog.component';
import { SlicePipe } from '@angular/common';
import { WalletType } from './wallet-types';

@Component({
  standalone: true,
  selector: 'wallet-button',
  templateUrl: './wallet-button.component.html',
  styleUrl: './wallet-button.component.scss',
  imports: [
    SlicePipe,
    MatFabButton,
    MatIcon,
    MatMenu,
    MatMenuItem,
    MatMenuTrigger
  ],
})
export class WalletButtonComponent {

  #matDialog = inject(MatDialog);
  
  publicKey = input<string>(undefined);
  @Output() connect = new EventEmitter<WalletType>();
  @Output() disconnect = new EventEmitter<void>();

  openWalletModal(): void {
    this.#matDialog.open(WalletsDialogComponent).afterClosed().subscribe((walletType) => {
      if (walletType) {
        this.connect.emit(walletType as WalletType);
      }
    });
  }

  copyAddress(): void {
    if (this.publicKey()) {
      navigator.clipboard.writeText(this.publicKey() as string).then(() => {});
    }
  }

}
