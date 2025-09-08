import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatTab, MatTabChangeEvent, MatTabGroup } from '@angular/material/tabs';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, first, map, switchMap, tap } from 'rxjs';
import { PublicKey } from '@solana/web3.js';
import { AddressComponent } from '../../../components/address/address.component';
import { DrawerContainerComponent } from '../../../components/drawer-container/drawer-container.component';
import { AssetsUtilizationRateChartComponent } from "./components/utilization-rate-chart/assets-utilization-rate-chart.component";
import { AssetsAprsChartComponent } from './components/aprs-chart/assets-aprs-chart.component';
import { LayoutService } from '../../../layout/layout.service';
import { DataService } from '../../../services/data.service';
import { WalletService } from '../../../services/wallet.service';
import { DepositDialogComponent, depositDialogConfigFactory } from '../../../components/deposit-dialog/deposit-dialog.component';
import { BorrowDialogComponent, borrowDialogConfigFactory } from '../../../components/borrow-dialog/borrow-dialog.component';


@Component({
  templateUrl: './asset-drawer.component.html',
  styleUrl: './asset-drawer.component.scss',
  imports: [
    MatTabGroup,
    MatTab,
    MatButton,
    AddressComponent,
    DrawerContainerComponent,
    AssetsUtilizationRateChartComponent,
    AssetsAprsChartComponent
]
})
export class AssetDrawerComponent implements OnInit, OnDestroy {

  #activatedRoute = inject(ActivatedRoute);
  #matDialog = inject(MatDialog);
  #layoutService = inject(LayoutService);
  #walletService = inject(WalletService);
  #dataService = inject(DataService);

  #assetData$ = this.#activatedRoute.params.pipe(
    first(),
    map(params => params['publicKey']),
    tap((pubKey) => {
      if (!pubKey) {
        this.close();
      }
    }),
    filter(pubKey => !!pubKey),
    switchMap(pubKey => this.#dataService.fetchAssetData(new PublicKey(pubKey))),
    tap((assetData) => {
      if (!assetData) {
        this.close();
      } else {
        this.loadingS.set(false);
      }
    })
  );

  loadingS = signal(true);
  assetS = toSignal(this.#assetData$);
  connectedS = toSignal(this.#walletService.connected$);
  depositedS = toSignal(this.#dataService.deposited$);
  tabIndexS = signal(0);

  // -----------------------------------------------------------------------------------------------------
  // @ Lifecycle hooks
  // -----------------------------------------------------------------------------------------------------

  ngOnInit(): void {
    this.#layoutService.openDrawer();
  }

  ngOnDestroy(): void {
    this.close();
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Public methods
  // -----------------------------------------------------------------------------------------------------

  close(): void {
    this.#layoutService.closeDrawer();
  }

  async deposit() {
    this.#matDialog.open(DepositDialogComponent, depositDialogConfigFactory(this.assetS().publicKey));
  }

  async borrow() {
    this.#matDialog.open(BorrowDialogComponent, borrowDialogConfigFactory(this.assetS().publicKey));
  }

  onTabChange(event: MatTabChangeEvent) {
    this.tabIndexS.set(-1);
    setTimeout(() => this.tabIndexS.set(event.index), 100);
  }

}
