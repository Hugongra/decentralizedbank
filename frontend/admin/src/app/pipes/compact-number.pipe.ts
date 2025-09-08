import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  standalone: true,
  name: 'compactNumber'
})
export class CompactNumberPipe implements PipeTransform {

  transform(value: number, decimals = 2): string {
    if (value === null || value === undefined || isNaN(value)) {
      return '';
    }
    const absValue = Math.abs(value);
    if (absValue >= 1_000_000_000) {
      return (value / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B';
    } else if (absValue >= 1_000_000) {
      return (value / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    } else if (absValue >= 1_000) {
      return (value / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
    } else {
      return value.toFixed(decimals);
    }
  }

}