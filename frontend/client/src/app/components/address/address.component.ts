import { SlicePipe } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { toSignal } from '@angular/core/rxjs-interop';
import { BehaviorSubject } from 'rxjs';
import { PublicKey } from '@solana/web3.js';
import { LayoutService } from '../../layout/layout.service';
import { Alert } from '../alert/alert.types';

@Component({
  selector: 'address',
  templateUrl: './address.component.html',
  styleUrl: './address.component.scss',
  imports: [
    SlicePipe,
    MatIcon
  ],
})
export class AddressComponent {

  #layoutService = inject(LayoutService);

  @Input() set address(value: PublicKey | string) {
    if (typeof value === 'string') {
      this.#address$.next(value);
    } else {
      this.#address$.next(value?.toBase58());
    }
  }

  #address$ = new BehaviorSubject<string | null>(null);

  addressS = toSignal(this.#address$);

  copyAddress(): void {
    if (this.addressS()) {
      navigator.clipboard.writeText(this.addressS() as string).then(() => {});
      this.#layoutService.addAlert(new Alert(`Copied address 
        ${this.addressS()}`, 'primary'));
    }
  }

}
