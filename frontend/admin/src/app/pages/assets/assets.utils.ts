import { FormControl, FormGroup, Validators } from "@angular/forms";
import { AssetConfig } from "../../../smart-contract/states/asset-state";

export function assetConfigFactory(form: FormGroup): AssetConfig {
    return new AssetConfig(
        form.value.optimalUtilizationRate,
        form.value.depositLimit,
        form.value.maxDepositApr,
        form.value.minDepositApr,
        form.value.borrowLimit,
        form.value.maxBorrowApr,
        form.value.minBorrowApr,
        form.value.rSlope1,
        form.value.rSlope2,
        form.value.borrowWeight,
        form.value.borrowFee,
        form.value.openLtv,
        form.value.closeLtv,
        form.value.maxCloseLtv,
        form.value.liquidationFee,
        form.value.oracleId
    );
}

export function assetConfigFormFactory(config: AssetConfig): FormGroup {
    return new FormGroup({
      optimalUtilizationRate: new FormControl(config.optimalUtilizationRate, [Validators.required, Validators.min(0), Validators.max(100)]),
      depositLimit: new FormControl(config.depositLimit, [Validators.required, Validators.min(0), Validators.max(100)]),
      minDepositApr: new FormControl(config.minDepositApr, [Validators.required, Validators.min(0), Validators.max(100)]),
      maxDepositApr: new FormControl(config.maxDepositApr, [Validators.required, Validators.min(0), Validators.max(100)]),
      borrowLimit: new FormControl(config.borrowLimit, [Validators.required, Validators.min(0), Validators.max(100)]),
      minBorrowApr: new FormControl(config.minBorrowApr, [Validators.required, Validators.min(0), Validators.max(100)]),
      maxBorrowApr: new FormControl(config.maxBorrowApr, [Validators.required, Validators.min(0), Validators.max(100)]),
      rSlope1: new FormControl(config.rSlope1, [Validators.required, Validators.min(0), Validators.max(100)]),
      rSlope2: new FormControl(config.rSlope2, [Validators.required, Validators.min(0), Validators.max(100)]),
      borrowWeight: new FormControl(config.borrowWeight, [Validators.required, Validators.min(0), Validators.max(100)]),
      borrowFee: new FormControl(config.borrowFee, [Validators.required, Validators.min(0), Validators.max(100)]),
      openLtv: new FormControl(config.openLtv, [Validators.required, Validators.min(0), Validators.max(100)]),
      closeLtv: new FormControl(config.closeLtv, [Validators.required, Validators.min(0), Validators.max(100)]),
      maxCloseLtv: new FormControl(config.maxCloseLtv, [Validators.required, Validators.min(0), Validators.max(100)]),
      liquidationFee: new FormControl(config.liquidationFee, [Validators.required, Validators.min(0), Validators.max(100)]),
      oracleId: new FormControl(config.oracleId, [Validators.required])
    });
}
