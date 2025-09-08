import { Component, inject } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { toSignal } from '@angular/core/rxjs-interop';
import { LayoutService } from '../../layout.service';
import { WalletButtonComponent } from '../wallet-button/wallet-button.component';
import { WalletService } from '../../../services/app/wallet.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
  imports: [
    MatIcon,
    MatIconButton,
    WalletButtonComponent
  ]
})
export class NavbarComponent {

  #router = inject(Router);
  #layoutService = inject(LayoutService);
  #walletService = inject(WalletService);

  overflowActiveS = toSignal(this.#layoutService.overflowActive$);
  publicKeyS = toSignal(this.#walletService.publicKey$);

  toggleNavigation() {
    this.#layoutService.toggleNavigation();
  }

  onDisconnect() {
    this.#walletService.disconnectWallet();
    this.#router.navigate(['/auth']);
  }

}
