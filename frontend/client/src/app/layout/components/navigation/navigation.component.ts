import { Component, inject, Signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { MatDivider } from '@angular/material/divider';
import { LayoutService } from '../../layout.service';

@Component({
  selector: 'app-navigation',
  standalone: true,
  templateUrl: './navigation.component.html',
  styleUrl: './navigation.component.scss',
  imports: [
    NgClass,
    RouterLink,
    MatIcon,
    MatIconButton,
    MatDivider
  ]
})
export class NavigationComponent {

  #layoutService = inject(LayoutService);

  mobileS = toSignal(this.#layoutService.mobile$);
  openS = toSignal(this.#layoutService.navigationOpen$);
  itemsS: Signal<NavigationItem[]> = toSignal(this.#layoutService.navigationItems$) as Signal<NavigationItem[]>;
  selectedItemS: Signal<string> = toSignal(this.#layoutService.selectedNavigationItem$) as Signal<string>;

  close(): void {
    this.#layoutService.toggleNavigation(false);
  }

  selectItem(id: string): void {
    this.#layoutService.selectedNavigationItem = id;
  }

}

export interface NavigationItem {

  id: string;

  title: string;

  subtitle?: string;

  icon?: string;

  disabled?: boolean;

  link?: string;

}

export const ASSETS_ITEM: NavigationItem = {
  id: 'assets',
  title: 'Assets',
  icon: 'mat_solid:currency_bitcoin',
  link: '/assets'
}

export const DEPOSITS_ITEM: NavigationItem = {
  id: 'deposits',
  title: 'Deposits',
  icon: 'mat_solid:savings',
  link: '/deposits'
}

export const BORROWS_ITEM: NavigationItem = {
  id: 'borrows',
  title: 'Borrows',
  icon: 'mat_outline:contract',
  link: '/borrows'
}

export const TRANSACTIONS_ITEM: NavigationItem = {
  id: 'transactions',
  title: 'Transactions',
  icon: 'mat_outline:history',
  link: '/transactions'
}
