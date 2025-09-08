import { ChangeDetectorRef, DestroyRef, inject, Pipe, PipeTransform } from '@angular/core';
import { filter, tap } from 'rxjs';
import { BankService } from '../services/app/bank.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Pipe({
  name: 'tokenPrice',
  pure: false
})
export class TokenPricePipe implements PipeTransform {

  #destroyRef = inject(DestroyRef);
  #cdr = inject(ChangeDetectorRef);
  #bankService = inject(BankService);

  #price: number = 0;

  transform(tokenId: number): number {
    this.updateValue(tokenId);
    return this.#price;
  }

  private updateValue(tokenId: number) {
    this.#bankService.tokenPriceRecords$.pipe(
      takeUntilDestroyed(this.#destroyRef),
      filter((records) => records.length > 0),
      tap((records) => {
        const record = records.find((record) => record.tokenId === tokenId);
        if (record) {
          this.#price = record.price;
          this.#cdr.markForCheck();
        }
      })
    )
    .subscribe();
  }

}
