package com.freedomfinance.bank.borrow.domain.models;

import com.freedomfinance.bank.bank.domain.models.IAsset;
import com.freedomfinance.bank.common.models.entities.IAccount;
import com.freedomfinance.bank.common.models.entities.IEntity;
import com.freedomfinance.bank.customer.domain.models.ICustomer;

public interface IBorrow extends IEntity, IAccount {

    IAsset getBorrowAsset();

    IAsset getCollateralAsset();

    ICustomer getCustomer();

}
