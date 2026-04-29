package com.freedomfinance.bank.deposit.domain.models;

import com.freedomfinance.bank.common.models.entities.IEntity;
import com.freedomfinance.bank.common.models.entities.IRecord;

public interface IDepositRecord extends IEntity, IRecord {

    IDeposit getDeposit();

    Double getDepositAmount();

    Double getDepositValue();

    Double getDepositRateIndex();

}
