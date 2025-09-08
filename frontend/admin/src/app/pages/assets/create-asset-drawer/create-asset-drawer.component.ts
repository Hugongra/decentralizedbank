import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatError, MatFormField, MatInput, MatLabel, MatSuffix } from '@angular/material/input';
import { MatDivider } from '@angular/material/divider';
import { PublicKey } from '@solana/web3.js';
import { DrawerContainerComponent } from "../../../components/drawer-container/drawer-container.component";
import { LayoutService } from '../../../layout/layout.service';
import { BankService } from '../../../services/app/bank.service';
import { AssetConfig } from '../../../../smart-contract/states/asset-state';

@Component({
  templateUrl: './create-asset-drawer.component.html',
  styleUrl: './create-asset-drawer.component.scss',
  imports: [
  NgTemplateOutlet,
  ReactiveFormsModule,
  FormsModule,
  MatInput,
  MatFormField,
  MatError,
  MatLabel,
  MatSuffix,
  MatButton,
  MatDivider,
  DrawerContainerComponent
],
})
export class CreateAssetDrawerComponent implements OnInit, OnDestroy {

  #layoutService = inject(LayoutService);
  #bankService = inject(BankService);

  form: FormGroup = new FormGroup({
    mint: new FormControl(PublicKey.default.toBase58(), Validators.required),
    representativeMint : new FormControl('', Validators.required),
    optimalUtilizationRate: new FormControl(80, [Validators.required, Validators.min(0), Validators.max(100)]),
    depositLimit: new FormControl(100, [Validators.required, Validators.min(0), Validators.max(100)]),
    minDepositApr: new FormControl(2, [Validators.required, Validators.min(0), Validators.max(100)]),
    maxDepositApr: new FormControl(10, [Validators.required, Validators.min(0), Validators.max(100)]),
    borrowLimit: new FormControl(100, [Validators.required, Validators.min(0), Validators.max(100)]),
    minBorrowApr: new FormControl(5, [Validators.required, Validators.min(0), Validators.max(100)]),
    maxBorrowApr: new FormControl(12, [Validators.required, Validators.min(0), Validators.max(100)]),
    rSlope1: new FormControl(5, [Validators.required, Validators.min(0), Validators.max(100)]),
    rSlope2: new FormControl(44, [Validators.required, Validators.min(0), Validators.max(100)]),
    borrowWeight: new FormControl(80, [Validators.required, Validators.min(0), Validators.max(100)]),
    borrowFee: new FormControl(24, [Validators.required, Validators.min(0), Validators.max(100)]),
    openLtv: new FormControl(75, [Validators.required, Validators.min(0), Validators.max(100)]),
    closeLtv: new FormControl(85, [Validators.required, Validators.min(0), Validators.max(100)]),
    maxCloseLtv: new FormControl(90, [Validators.required, Validators.min(0), Validators.max(100)]),
    liquidationFee: new FormControl(5, [Validators.required, Validators.min(0), Validators.max(100)]),
    oracleId: new FormControl('FrbSNm7wbeAguqbkohH74tbkv2uK1dXd52KAxaC2fWaS', [Validators.required])
  });

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

  async createAsset(): Promise<void> {
    const mint: PublicKey = new PublicKey(this.form.value.mint);
    const representativeMint: PublicKey = new PublicKey(this.form.value.representativeMint);
    const assetConfig: AssetConfig = {
      optimalUtilizationRate: this.form.value.optimalUtilizationRate,
      depositLimit: this.form.value.depositLimit,
      minDepositApr: this.form.value.minDepositApr,
      maxDepositApr: this.form.value.maxDepositApr,
      borrowLimit: this.form.value.borrowLimit,
      minBorrowApr: this.form.value.minBorrowApr,
      maxBorrowApr: this.form.value.maxBorrowApr,
      rSlope1: this.form.value.rSlope1,
      rSlope2: this.form.value.rSlope2,
      borrowWeight: this.form.value.borrowWeight,
      borrowFee: this.form.value.borrowFee,
      openLtv: this.form.value.openLtv,
      closeLtv: this.form.value.closeLtv,
      maxCloseLtv: this.form.value.maxCloseLtv,
      liquidationFee: this.form.value.liquidationFee,
      oracleId: new PublicKey(this.form.value.oracleId)
    };
    await this.#bankService.createAsset(mint, representativeMint, assetConfig);
  }

}
