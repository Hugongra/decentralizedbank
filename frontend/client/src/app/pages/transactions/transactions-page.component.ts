import { DatePipe, NgClass, NgTemplateOutlet } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatIcon } from '@angular/material/icon';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { BehaviorSubject, map, switchMap, takeUntil, tap, timer } from 'rxjs';
import { LayoutService } from '../../layout/layout.service';
import { ApiService } from '../../services/api.service';
import { TransactionFilter, TransactionType } from '../../services/models/api/transaction';
import { NumberFormatterPipe } from '../../pipes/number-formatter.pipe';
import { SortType } from '../../core/utils';
import { ActivatedRoute } from '@angular/router';

@Component({
  templateUrl: './transactions-page.component.html',
  styleUrl: './transactions-page.component.scss',
  imports: [
    DatePipe,
    NgClass,
    NgTemplateOutlet,
    MatProgressSpinner,
    MatIcon,
    NumberFormatterPipe
  ]
})
export class TransactionsPageComponent {

  #destroyRef = inject(DestroyRef);
  #activedRoute = inject(ActivatedRoute);
  #layoutService = inject(LayoutService);
  #apiService = inject(ApiService);

  transactionType = TransactionType;
  #filter = new TransactionFilter(this.#activedRoute.snapshot.data['userPublicKey']);
  #selectedFilter$ = new BehaviorSubject<AssetsFilter>({name: 'BORROW_ASSET', sort: 'ASC'});

  loadingS = signal(true);
  mobileS = toSignal(this.#layoutService.mobile$);
  selectedFilterS = toSignal(this.#selectedFilter$);

  transactionsS = toSignal(timer(0, 30000).pipe(
    takeUntilDestroyed(this.#destroyRef),
    tap(() => this.loadingS.set(true)),
    switchMap(() => this.#apiService.findUserTransactions(this.#filter)),
    map(page => page.content),
    tap(() => this.loadingS.set(false))
  ));
      

  selectFilter(name: AssetsFilterName, sort: SortType) {
    this.#selectedFilter$.next({name, sort});
  }

}

interface AssetsFilter {
  name: AssetsFilterName,
  sort: SortType
}

type AssetsFilterName = 'BORROW_ASSET' | 'DEPOSIT_ASSET' | 'BORROWED' | 'OWED' | 'COLLATERED';
