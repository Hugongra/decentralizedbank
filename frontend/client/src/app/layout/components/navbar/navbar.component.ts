import { Component, inject } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { toSignal } from '@angular/core/rxjs-interop';
import { LayoutService } from '../../layout.service';
import { WalletButtonComponent } from '../wallet-button/wallet-button.component';

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

  #layoutService = inject(LayoutService);

  overflowActiveS = toSignal(this.#layoutService.overflowActive$);

  toggleNavigation() {
    this.#layoutService.toggleNavigation();
  }

}
