import { Component, EventEmitter, input, Input, Output } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { TimeUnit } from '../../services/models/api/record-filter';

@Component({
  selector: 'date-filter',
  templateUrl: './date-filter.component.html',
  imports: [
    MatButton,
    MatMenu,
    MatMenuItem,
    MatMenuTrigger
  ],
  styles: `
  :host {
    display: block;
    width: fit-content;
  }
  `
})
export class DateFilterComponent {

  timeUnit = input<TimeUnit>(TimeUnit.DAYS);

  TimeUnit = TimeUnit;

  @Output() timeUnitChange = new EventEmitter<TimeUnit>();

  onDateFilterChange(timeUnit: TimeUnit) {
    this.timeUnitChange.emit(timeUnit);
  }

}
