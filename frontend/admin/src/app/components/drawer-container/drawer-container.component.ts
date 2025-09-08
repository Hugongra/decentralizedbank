import { Component, ContentChild, ElementRef, EventEmitter, input, Output } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

@Component({
  selector: 'drawer-container',
  standalone: true,
  templateUrl: './drawer-container.component.html',
  styleUrl: './drawer-container.component.scss',
  imports: [
    MatIcon,
    MatIconButton,
    MatProgressSpinner
  ],
})
export class DrawerContainerComponent {

  @ContentChild('footer') footer: ElementRef;
  @Output() close = new EventEmitter<void>();

  loading = input<boolean>(true);

  onClickClose() {
    this.close.emit();
  }

}
