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
  templateUrl: './deposits-page.component.html',
  styleUrl: './deposits-page.component.scss',
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
export class DepositsPageComponent implements OnInit, OnDestroy {

  #destroyRef = inject(DestroyRef);
  #router = inject(Router);
  #layoutService = inject(LayoutService);
  #dataService = inject(DataService);

  @ViewChild('matDrawer', {static: true}) matDrawer: MatDrawer;

  #selectedFilter$ = new BehaviorSubject<AssetsFilter>({name: 'SYMBOL', sort: 'ASC'});
  #deposits$ = this.#dataService.deposits$.pipe(
    takeUntilDestroyed(this.#destroyRef),
    tap((deposits) => {
      if (deposits.length == 0) {
        this.#router.navigate(['assets']);
      }
    })
  );
  
  mobileS = toSignal(this.#layoutService.mobile$);
  loadingS = signal(true);
  selectedFilterS = toSignal(this.#selectedFilter$);
  depositsS = toSignal(combineLatest([this.#deposits$, this.#selectedFilter$]).pipe(
    tap(() => this.loadingS.set(true)),
    map(([deposits, filter]) => {
      if (filter.name === 'SYMBOL') {
        return deposits.sort((a, b) => filter.sort === 'ASC' ? a.depositAsset.symbol.localeCompare(b.depositAsset.symbol) : b.depositAsset.symbol.localeCompare(a.depositAsset.symbol));
      } else if (filter.name === 'EARNED') {
        return deposits.sort((a, b) => filter.sort === 'ASC' ? a.earnedValue - b.earnedValue : b.earnedValue - a.earnedValue);
      } else if (filter.name === 'AVAILABLE') {
        return deposits.sort((a, b) => filter.sort === 'ASC' ? a.availableValue - b.availableValue : b.availableValue - a.availableValue);
      } else if (filter.name === 'COLLATERED') {
        return deposits.sort((a, b) => filter.sort === 'ASC' ? a.collateredValue - b.collateredValue : b.collateredValue - a.collateredValue);
      }
      return deposits;
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
        this.#router.navigate(['/deposits']);
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
  name: AssetsFilterName;
  sort: SortType;
}

type AssetsFilterName = 'SYMBOL' | 'EARNED' | 'AVAILABLE' | 'COLLATERED';