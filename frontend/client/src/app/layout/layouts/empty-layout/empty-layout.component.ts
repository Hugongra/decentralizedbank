import { NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'empty-layout',
  templateUrl: './empty-layout.component.html',
  styleUrl: './empty-layout.component.scss',
  imports: [
    RouterOutlet,
    NgIf
  ],
})
export class EmptyLayoutComponent {

}
