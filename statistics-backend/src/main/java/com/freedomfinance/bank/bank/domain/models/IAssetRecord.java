package com.freedomfinance.bank.bank.domain.models;

import com.freedomfinance.bank.common.models.entities.IEntity;
import com.freedomfinance.bank.common.models.entities.IRecord;

public interface IAssetRecord extends IEntity, IRecord {
    IAsset getAsset();
    Short getDepositApr();
    Short getBorrowApr();
    Double getDepositAmount();
    Double getDepositValue();
    Double getBorrowAmount();
    Double getBorrowValue();
    Double getDepositGlobalRate();
    Double getBorrowGlobalRate();
    void update(Short depositApr, Short borrowApr, Double depositAmount, Double depositValue, Double borrowAmount,
                Double borrowValue, Double depositGlobalRate, Double borrowGlobalRate);
    boolean isSlate();

}
