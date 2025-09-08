import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgTemplateOutlet } from '@angular/common';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatTab, MatTabChangeEvent, MatTabGroup } from '@angular/material/tabs';
import { MatError, MatFormField, MatInput, MatSuffix } from '@angular/material/input';
import { MatDivider } from '@angular/material/divider';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, tap } from 'rxjs';
import { AddressComponent } from '../../../components/address/address.component';
import { DrawerContainerComponent } from '../../../components/drawer-container/drawer-container.component';
import { LayoutService } from '../../../layout/layout.service';
import { BankService } from '../../../services/app/bank.service';
import { assetConfigFactory, assetConfigFormFactory } from '../assets.utils';


@Component({
  templateUrl: './update-asset-drawer.component.html',
  styleUrl: './update-asset-drawer.component.scss',
  imports: [
    NgTemplateOutlet,
    ReactiveFormsModule,
    FormsModule,
    MatIcon,
    MatIconButton,
    MatTabGroup,
    MatTab,
    MatInput,
    MatError,
    MatFormField,
    MatSuffix,
    MatButton,
    MatDivider,
    AddressComponent,
    DrawerContainerComponent
  ],
})
export class UpdateAssetDrawerComponent implements OnInit, OnDestroy {

  #activatedRoute = inject(ActivatedRoute);
  #layoutService = inject(LayoutService);
  #bankService = inject(BankService);
  
  editableS = signal(false);
  loadingS = signal(true);
  tabS = signal(0);
  extendedAssetStateS = toSignal(this.#bankService.getAsset(this.#activatedRoute.snapshot.params['pubkey']).pipe(
    filter((asset) => !!asset),
    tap(() => this.loadingS.set(false))
  ));

  form: FormGroup = new FormGroup({});

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
    this.ngOnDestroy();
  }

  toggleEdit(): void {
    this.form = assetConfigFormFactory(this.extendedAssetStateS().state.config);
    this.editableS.update(v => !v);
  }

  updateAsset(): void {
    this.#bankService.updateAsset(this.extendedAssetStateS().state.pubKey, assetConfigFactory(this.form));
  }

  onTabChange(event: MatTabChangeEvent) {
    this.tabS.set(-1);
    setTimeout(() => this.tabS.set(event.index), 100);
  }

}
