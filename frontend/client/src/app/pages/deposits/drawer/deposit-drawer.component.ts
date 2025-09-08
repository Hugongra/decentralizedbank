import { Component, DestroyRef, inject, OnDestroy, OnInit, Signal, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { tap } from 'rxjs'
import { PublicKey } from '@solana/web3.js';
import { AddressComponent } from '../../../components/address/address.component';
import { DrawerContainerComponent } from '../../../components/drawer-container/drawer-container.component';
import { NumberFormatterPipe } from '../../../pipes/number-formatter.pipe';
import { LayoutService } from '../../../layout/layout.service';
import { WithdrawDialogComponent, withdrawDialogConfigFactory} from '../withdraw-dialog/withdraw-dialog.component';
import { DataService } from '../../../services/data.service';
import { DepositDialogComponent, depositDialogConfigFactory } from '../../../components/deposit-dialog/deposit-dialog.component';
import { UserDepositsChartComponent } from './user-deposits-chart/user-deposits-chart.component';
import { DepositData } from '../../../services/models/data/deposit-data';


@Component({
  standalone: true,
  templateUrl: './deposit-drawer.component.html',
  styleUrl: './deposit-drawer.component.scss',
  imports: [
    MatButton,
    AddressComponent,
    DrawerContainerComponent,
    NumberFormatterPipe,
    UserDepositsChartComponent
]
})
export class DepositDrawerComponent implements OnInit, OnDestroy  {

  #destroyRef = inject(DestroyRef);
  #activatedRoute = inject(ActivatedRoute);
  #matDialog = inject(MatDialog);
  #layoutService = inject(LayoutService);
  #dataService = inject(DataService);

  loadingS = signal(false);
  publicKeyS: Signal<PublicKey>;
  depositDataS: Signal<DepositData>;

  constructor() {
    const publicKey = new PublicKey(this.#activatedRoute.snapshot.params['publicKey']);
    if (publicKey) {
      this.publicKeyS = signal(publicKey);
      this.depositDataS = toSignal(this.#dataService.fetchDepositData(publicKey).pipe(
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

  deposit() {
    this.#matDialog.open(DepositDialogComponent, depositDialogConfigFactory(this.depositDataS().depositAsset.publicKey));
  }

  withdraw() {
    this.#matDialog.open(WithdrawDialogComponent, withdrawDialogConfigFactory(this.depositDataS().publicKey, this.depositDataS().depositAsset.publicKey));
  }

}