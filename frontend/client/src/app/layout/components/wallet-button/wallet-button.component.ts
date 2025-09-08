import { Component, inject } from '@angular/core';
import { MatFabButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { WalletsDialogComponent } from './wallet-dialog/wallet-dialog.component';
import { SlicePipe } from '@angular/common';
import { WalletService } from '../../../services/wallet.service';
import { WalletType } from './wallet-types';

@Component({
  selector: 'wallet-button',
  templateUrl: './wallet-button.component.html',
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
  #walletService = inject(WalletService);

  publicKeyS = toSignal(this.#walletService.publicKey$.pipe(map((publicKey) => publicKey?.toBase58())));

  openWalletModal(): void {
    this.#matDialog.open(WalletsDialogComponent).afterClosed().subscribe((walletType) => {
      if (walletType) {
        this.#walletService.connectWallet(walletType as WalletType);
      }
    });
  }

  disconnectWallet(): void {
    this.#walletService.disconnectWallet();
  }

  copyAddress(): void {
    if (this.publicKeyS()) {
      navigator.clipboard.writeText(this.publicKeyS() as string).then(() => {});
    }
  }

}
