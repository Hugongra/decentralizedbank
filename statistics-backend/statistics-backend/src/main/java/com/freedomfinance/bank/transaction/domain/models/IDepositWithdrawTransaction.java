package com.freedomfinance.bank.transaction.domain.models;

import com.freedomfinance.bank.bank.domain.models.IAsset;

public interface IDepositWithdrawTransaction extends ITransaction {

    IAsset getDepositAsset();

    Double getDepositAmount();

    Double getDepositValue();

}

