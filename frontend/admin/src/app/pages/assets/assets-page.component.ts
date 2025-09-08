import { NgClass, NgTemplateOutlet } from '@angular/common';
import { Component, DestroyRef, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { MatDrawer, MatDrawerContainer, MatDrawerContent } from "@angular/material/sidenav";
import { MatButton } from '@angular/material/button';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { BehaviorSubject } from 'rxjs';
import { PublicKey } from '@solana/web3.js';
import { CompactNumberPipe } from '../../pipes/compact-number.pipe';
import { LayoutService } from '../../layout/layout.service';
import { BankService } from '../../services/app/bank.service';
import { TokenPricePipe } from '../../pipes/token-price.pipe';

@Component({
  templateUrl: './assets-page.component.html',
  styleUrl: './assets-page.component.scss',
  imports: [
    NgClass,
    RouterOutlet,
    NgTemplateOutlet,
    MatIcon,
    MatDrawer,
    MatDrawerContent,
    MatDrawerContainer,
    MatButton,
    CompactNumberPipe,
    TokenPricePipe
  ]
})
export class AssetsPageComponent implements OnInit, OnDestroy {

  #destroyRef = inject(DestroyRef);
  #router = inject(Router);
  #layoutService = inject(LayoutService);
  #bankService = inject(BankService);

  @ViewChild('matDrawer', {static: true}) matDrawer: MatDrawer;

  #selectedFilter$ = new BehaviorSubject<AssetsFilter>({name: 'ALL', sort: 'NONE'});

  mobileS = toSignal(this.#layoutService.mobile$);
  assetsS = toSignal(this.#bankService.assets$);
  selectedFilterS = toSignal(this.#selectedFilter$);

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
        this.#router.navigate(['/assets']);
      }
    });
  }

  ngOnDestroy(): void {
    this.#layoutService.initDrawer();
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Public methods
  // -----------------------------------------------------------------------------------------------------

  open(assetPubKey: PublicKey) {
    this.#router.navigate([this.#router.url, assetPubKey.toBase58()]);
  }

  createAsset() {
    this.#router.navigate([this.#router.url, 'new']);
  }

  close() {
    this.#layoutService.closeDrawer();
  }

  selectFilter(name: AssetsFilterName, sort: AssetsFilterSort) {
    this.#selectedFilter$.next({name, sort});
  }

}

interface AssetsFilter {
  name: 'ALL' | 'NAME' | 'DEPOSIT' | 'BORROW' | 'LTV/BW' | 'DEPOSIT APR' | 'BORROW APR';
  sort: 'UP' | 'DOWN' | 'NONE';
}

type AssetsFilterName = 'ALL' | 'NAME' | 'DEPOSIT' | 'BORROW' | 'LTV/BW' | 'DEPOSIT APR' | 'BORROW APR';
type AssetsFilterSort = 'UP' | 'DOWN' | 'NONE';

