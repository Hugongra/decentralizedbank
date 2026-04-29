package com.freedomfinance.bank.transaction.domain.models;

import com.freedomfinance.bank.bank.domain.models.IAsset;

public interface IBorrowRepayTransaction extends ITransaction {

    IAsset getBorrowAsset();

    IAsset getCollateralAsset();

    Double getBorrowAmount();

    Double getBorrowValue();

    Double getCollateralAmount();

    Double getCollateralValue();

}

