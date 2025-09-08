import { Component, DestroyRef, inject, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { NgClass, NgTemplateOutlet } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { MatDrawer, MatDrawerContainer, MatDrawerContent } from "@angular/material/sidenav";
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { BehaviorSubject, combineLatest, map, tap } from 'rxjs';
import { NumberFormatterPipe } from '../../pipes/number-formatter.pipe';
import { LayoutService } from '../../layout/layout.service';
import { SortType } from '../../core/utils';
import { DataService } from '../../services/data.service';
import { PublicKey } from '@solana/web3.js';


@Component({
  templateUrl: './assets-page.component.html',
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
export class AssetsPageComponent implements OnInit, OnDestroy {

  #destroyRef = inject(DestroyRef);
  #router = inject(Router);
  #layoutService = inject(LayoutService);
  #bankService = inject(DataService);

  @ViewChild('matDrawer', {static: true}) matDrawer: MatDrawer;

  #filter$ = new BehaviorSubject<Filter>({name: 'NAME', sort: 'ASC'});
  #assets$ = this.#bankService.assets$.pipe(
    tap(() => this.loadingS.set(false))
  );
  loadingS = signal(true);
  mobileS = toSignal(this.#layoutService.mobile$);
  filterS = toSignal(this.#filter$);
  assetsS = toSignal(combineLatest([this.#assets$, this.#filter$]).pipe(
    map(([assets, filter]) => {
      if (filter.name === 'NAME') {
        return assets.sort((a, b) => filter.sort === 'ASC' ? a.symbol.localeCompare(b.symbol) : b.symbol.localeCompare(a.symbol));
      } else if (filter.name === 'DEPOSIT') {
        return assets.sort((a, b) => filter.sort === 'ASC' ? a.depositedValue - b.depositedValue : b.depositedValue - a.depositedValue);
      } else if (filter.name === 'BORROW') {
        return assets.sort((a, b) => filter.sort === 'ASC' ? a.borrowedValue - b.borrowedValue : b.borrowedValue - a.borrowedValue);
      } else if (filter.name === 'LTV/BW') {
        return assets.sort((a, b) => filter.sort === 'ASC' ? a.ltvBw - b.ltvBw : b.ltvBw - a.ltvBw);
      } else if (filter.name === 'DEPOSIT_APR') {
        return assets.sort((a, b) => filter.sort === 'ASC' ? a.depositApr - b.depositApr : b.depositApr - a.depositApr);
      } else if (filter.name === 'BORROW_APR') {
        return assets.sort((a, b) => filter.sort === 'ASC' ? a.borrowApr - b.borrowApr : b.borrowApr - a.borrowApr);
      }
      return assets;
    })
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
        this.#router.navigate(['/dashboard']);
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

  selectFilter(name: FilterName, sort: SortType) {
    this.#filter$.next({name, sort});
  }

}

type FilterName = 'NAME' | 'DEPOSIT' | 'BORROW' | 'LTV/BW' | 'DEPOSIT_APR' | 'BORROW_APR';

interface Filter {
  name: FilterName;
  sort: SortType;
}
