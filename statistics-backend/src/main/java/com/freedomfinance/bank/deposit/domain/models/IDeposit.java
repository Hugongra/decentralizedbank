package com.freedomfinance.bank.deposit.domain.models;

import com.freedomfinance.bank.bank.domain.models.IAsset;
import com.freedomfinance.bank.common.models.entities.IAccount;
import com.freedomfinance.bank.common.models.entities.IEntity;
import com.freedomfinance.bank.customer.domain.models.ICustomer;

public interface IDeposit extends IEntity, IAccount {

    IAsset getAsset();

    ICustomer getCustomer();

}
