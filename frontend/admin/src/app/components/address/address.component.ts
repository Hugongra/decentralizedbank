import { SlicePipe } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIcon } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PublicKey } from '@solana/web3.js';
import { BehaviorSubject } from 'rxjs';

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

  #snackBar = inject(MatSnackBar);

  @Input() set address(value: PublicKey | string) {
    if (typeof value === 'string') {
      this.#address$.next(value);
    } else {
      this.#address$.next(value.toBase58());
    }
  }

  #address$ = new BehaviorSubject<string | null>(null);

  addressS = toSignal(this.#address$);

  copyAddress(): void {
    if (this.addressS()) {
      navigator.clipboard.writeText(this.addressS() as string).then(() => {});
      this.#snackBar.open(`Address ${this.addressS()} copied`, '', {duration: 2000});
    }
  }

}
