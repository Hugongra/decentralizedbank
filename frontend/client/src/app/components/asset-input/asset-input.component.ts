import { Component, computed, EventEmitter, Input, input, Output, signal } from '@angular/core';
import { MatFabButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { NumberFormatterPipe } from '../../pipes/number-formatter.pipe';

@Component({
  standalone: true,
  selector: 'asset-input',
  templateUrl: './asset-input.component.html',
  styleUrl: './asset-input.component.scss',
  imports: [
    MatIcon,
    MatIconButton,
    MatFabButton,
    NumberFormatterPipe
  ],
})
export class AssetInputComponent {

  @Input() symbol: string;
  @Input() decimals: number;
  price = input<number>(0);
  amount = input<number>(0);
  max = input<number>(0);
  @Output() amountChange = new EventEmitter<number>();
  @Output() invertedChange = new EventEmitter<boolean>();

  invertedS = signal<boolean>(false);
  priceS = computed(() => {
    const price = this.price();
    const amount = this.amount();
    if (this.invertedS()) {
      return price === 0 ? 0 : amount/price;
    } else {
      return price*amount;
    }
  });

  onAmountChange(amount: string) {
    let parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount)) {
      return;
    }
    if (parsedAmount > 18446744073709) {
      parsedAmount = 18446744073709;
    } else if (parsedAmount < 0) {
      parsedAmount = 0;
    }
    this.amountChange.emit(parsedAmount);
  }

  invert() {
    this.invertedS.update(v => !v);
    this.invertedChange.emit(this.invertedS());
  }

  maxAmount() {
    this.amountChange.emit(this.max());
  }

}
