import { Component, DestroyRef, inject, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { NgClass, NgTemplateOutlet } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { MatDrawer, MatDrawerContainer, MatDrawerContent } from "@angular/material/sidenav";
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { BehaviorSubject, combineLatest, map, tap } from 'rxjs';
import { PublicKey } from '@solana/web3.js';
import { NumberFormatterPipe } from '../../pipes/number-formatter.pipe';
import { LayoutService } from '../../layout/layout.service';
import { SortType } from '../../core/utils';
import { DataService } from '../../services/data.service';

@Component({
  standalone: true,
  templateUrl: './borrows-page.component.html',
  styleUrl: './borrows-page.component.scss',
  imports: [
    NgClass,
    RouterOutlet,
    NgTemplateOutlet,
    MatIcon,
    MatDrawer,
    MatDrawerContent,
    MatDrawerContainer,
    MatProgressSpinner,
    NumberFormatterPipe
  ]
})
export class BorrowsPageComponent implements OnInit, OnDestroy {

  #destroyRef = inject(DestroyRef);
  #router = inject(Router);
  #layoutService = inject(LayoutService);
  #dataService = inject(DataService);

  @ViewChild('matDrawer', {static: true}) matDrawer: MatDrawer;

  #selectedFilter$ = new BehaviorSubject<AssetsFilter>({name: 'BORROW_ASSET', sort: 'ASC'});
  #borrows$ = this.#dataService.borrows$.pipe(
    takeUntilDestroyed(this.#destroyRef),
    tap(borrows => {
    if (borrows.length === 0) {
      this.#router.navigate(['/assets']);
    }
  }));

  loadingS = signal(true);
  mobileS = toSignal(this.#layoutService.mobile$);
  selectedFilterS = toSignal(this.#selectedFilter$);
  borrowsS = toSignal(combineLatest([this.#borrows$, this.#selectedFilter$]).pipe(
    takeUntilDestroyed(this.#destroyRef),
    tap(() => this.loadingS.set(true)),
    map(([borrows, filter]) => {
      if (filter.name === 'BORROW_ASSET') {
        return borrows.sort((a, b) => filter.sort === 'ASC' ? a.borrowAsset.symbol.localeCompare(b.borrowAsset.symbol) : b.borrowAsset.symbol.localeCompare(a.borrowAsset.symbol));
      } else if (filter.name === 'DEPOSIT_ASSET') {
        return borrows.sort((a, b) => filter.sort === 'ASC' ? a.collateralAsset.symbol.localeCompare(b.collateralAsset.symbol) : b.collateralAsset.symbol.localeCompare(a.collateralAsset.symbol));
      } else if (filter.name === 'BORROWED') {
        return borrows.sort((a, b) => filter.sort === 'ASC' ? a.borrowedValue - b.borrowedValue : b.borrowedValue - a.borrowedValue);
      } else if (filter.name === 'OWED') {
        return borrows.sort((a, b) => filter.sort === 'ASC' ? a.owedValue - b.owedValue : b.owedValue - a.owedValue);
      } else if (filter.name === 'COLLATERED') {
        return borrows.sort((a, b) => filter.sort === 'ASC' ? a.collateredValue - b.collateredValue : b.collateredValue - a.collateredValue);
      }
      return borrows;
    }),
    tap(() => this.loadingS.set(false))
  ));

  // -----------------------------------------------------------------------------------------------------
  // @ Lifecycle hooks
  // -----------------------------------------------------------------------------------------------------

  ngOnInit(): void {
    this.#layoutService.drawerStatus$
    .pipe(takeUntilDestroyed(this.#destroyRef))
    .subscribe(status => {
      if (status === 'opened') {
        this.matDrawer.open();
      } else if (status === 'closed') {
        this.matDrawer.close();
        this.#router.navigate(['/borrows']);
      }
    });
  }

  ngOnDestroy(): void {
    this.#layoutService.initDrawer();
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Public methods
  // -----------------------------------------------------------------------------------------------------

  open(pubKey: PublicKey) {
    this.#router.navigate([this.#router.url, pubKey.toBase58()]);
  }

  close() {
    this.#layoutService.closeDrawer();
  }

  selectFilter(name: AssetsFilterName, sort: SortType) {
    this.#selectedFilter$.next({name, sort});
  }

}

interface AssetsFilter {
  name: AssetsFilterName,
  sort: SortType
}

type AssetsFilterName = 'BORROW_ASSET' | 'DEPOSIT_ASSET' | 'BORROWED' | 'OWED' | 'COLLATERED';
