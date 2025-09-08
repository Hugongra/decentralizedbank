import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormField } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { MatButton } from '@angular/material/button';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { PublicKey } from '@solana/web3.js';
import { AddressComponent } from '../../components/address/address.component';
import { BankService } from '../../services/app/bank.service';
import { LayoutService } from '../../layout/layout.service';
import { Alert } from '../../components/alert/alert.types';

@Component({
  templateUrl: './bank.component.html',
  styleUrl: './bank.component.scss',
  imports: [
    ReactiveFormsModule,
    FormsModule,
    MatFormField,
    MatInput,
    MatSlideToggle,
    MatButton,
    AddressComponent
  ]
})
export class BankPageComponent implements OnInit {

  #destroyRef = inject(DestroyRef);
  #layoutService = inject(LayoutService);
  #bankService = inject(BankService);

  formGroup = new FormGroup({
    liquidator: new FormControl('', Validators.required),
    feeVault: new FormControl('', Validators.required)
  });
  resetDefconS = signal(false);
  bankS = toSignal(this.#bankService.bank$);

  ngOnInit(): void {
    this.#bankService.bank$
    .pipe(
      takeUntilDestroyed(this.#destroyRef),
      filter(bank => !!bank)
    )
    .subscribe(bank => {
      if (bank.init) {
        this.formGroup.setValue({
          liquidator: bank.liquidatorBase58,
          feeVault: bank.feeVaultBase58,
        });
      }
    });
  }

  onDefconChange(): void {
    this.resetDefconS.update(v => !v);
  }

  async createBank(): Promise<void> {
    try {
      const txId = await this.#bankService.createBank(new PublicKey(this.formGroup.value.liquidator), new PublicKey(this.formGroup.value.feeVault));
      this.#layoutService.addAlert(new Alert(`Bank successfully created: 
      Transaction id ${txId}`));
    } catch(error) {
      this.#layoutService.addAlert(new Alert(`Failed to create bank: ${error}`, 'error'));
    }
  }

  async updateBank(): Promise<void> {
    try {
      const txId = await this.#bankService.updateBank(new PublicKey(this.formGroup.value.liquidator), new PublicKey(this.formGroup.value.feeVault), this.resetDefconS());
      this.#layoutService.addAlert(new Alert(`Bank successfully updated: 
      Transaction id ${txId}`));
    } catch(error) {
      this.#layoutService.addAlert(new Alert(`Failed to update bank: ${error}`, 'error'));
    }
  }

}
