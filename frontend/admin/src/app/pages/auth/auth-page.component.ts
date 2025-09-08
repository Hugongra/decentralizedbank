import { Component, inject } from '@angular/core';
import { WalletButtonComponent } from '../../layout/components/wallet-button/wallet-button.component';
import { Router } from '@angular/router';
import { WalletService } from '../../services/app/wallet.service';
import { dev } from '../../../environments/env';
import { WalletType } from '../../layout/components/wallet-button/wallet-types';

@Component({
  templateUrl: './auth-page.component.html',
  styleUrl: './auth-page.component.scss',
  imports: [WalletButtonComponent]
})
export class AuthPageComponent {

  #router = inject(Router);
  #walletService = inject(WalletService);
  
  async onConnect(walletType: WalletType) {
    try {
      await this.#walletService.connectWallet(walletType);
      this.#router.navigate(['/bank']);
    } catch (error) {
      if (dev) console.log(error);
    }
  }

}
