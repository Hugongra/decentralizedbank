import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  standalone: true,
  name: 'numberFormatter'
})
export class NumberFormatterPipe implements PipeTransform {

  transform(value: number, decimals: number = 2, compact: boolean = true): string {
    if (value === null || value === undefined || isNaN(value) || value === 0) {
      return '0';
    }
    const absValue = Math.abs(value);
    if (compact && absValue > 1_000) {
      if (absValue >= 1_000_000_000) {
        return (value / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B';
      } else if (absValue >= 1_000_000) {
        return (value / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
      } else {
        return (value / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
      }
    } else {
      const [_, decimalPart] = value.toString().split(".");
      if (!decimalPart) {
        return value.toFixed(0);
      }
      const currentDecimals = Math.min(decimalPart.length, decimals);
      return value.toFixed(currentDecimals);
    }
  }

}