import { Component, DestroyRef, inject, OnDestroy, OnInit, Signal, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatButton } from '@angular/material/button';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { tap } from 'rxjs';
import { PublicKey } from '@solana/web3.js';
import { AddressComponent } from '../../../components/address/address.component';
import { DrawerContainerComponent } from '../../../components/drawer-container/drawer-container.component';
import { NumberFormatterPipe } from '../../../pipes/number-formatter.pipe';
import { LayoutService } from '../../../layout/layout.service';
import { BorrowDialogComponent, borrowDialogConfigFactory } from '../../../components/borrow-dialog/borrow-dialog.component';
import { DataService } from '../../../services/data.service';
import { RepayDialogComponent, repayDialogConfigFactory } from '../repay-dialog/repay-dialog.component';
import { BorrowData } from '../../../services/models/data/borrow-data';
import { UserBorrowsChartComponent } from './user-borrows-chart/user-borrows-chart.component';

@Component({
  standalone: true,
  templateUrl: './borrow-drawer.component.html',
  styleUrl: './borrow-drawer.component.scss',
  imports: [
    MatButton,
    AddressComponent,
    DrawerContainerComponent,
    UserBorrowsChartComponent,
    NumberFormatterPipe
]
})
export class BorrowDrawerComponent implements OnInit, OnDestroy {
  
  #destroyRef = inject(DestroyRef);
  #activatedRoute = inject(ActivatedRoute);
  #matDialog = inject(MatDialog);
  #layoutService = inject(LayoutService);
  #dataService = inject(DataService);

  loadingS = signal(false);
  publicKeyS: Signal<PublicKey>;
  borrowDataS: Signal<BorrowData>;

  constructor() {
    const publicKey = new PublicKey(this.#activatedRoute.snapshot.params['publicKey']);
    if (publicKey) {
      this.publicKeyS = signal(publicKey);
      this.borrowDataS = toSignal(this.#dataService.fetchBorrowData(publicKey).pipe(
        takeUntilDestroyed(this.#destroyRef),
        tap((depositData) => {
          if (depositData) {
            this.loadingS.set(false);
          } else {
            this.close();
          }
        })
      ));
    } else {
      this.close();
    }
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Lifecycle hooks
  // -----------------------------------------------------------------------------------------------------

  ngOnInit(): void {
    this.#layoutService.openDrawer();
  }

  ngOnDestroy(): void {
    this.#layoutService.closeDrawer();
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Public methods
  // -----------------------------------------------------------------------------------------------------

  close(): void {
    this.#layoutService.closeDrawer();
  }

  borrow() {
    this.#matDialog.open(BorrowDialogComponent, borrowDialogConfigFactory(this.borrowDataS().borrowAsset.publicKey, this.borrowDataS().depositPublicKey));
  }

  repay() {
    this.#matDialog.open(RepayDialogComponent, repayDialogConfigFactory(this.borrowDataS().publicKey));
  }

}
