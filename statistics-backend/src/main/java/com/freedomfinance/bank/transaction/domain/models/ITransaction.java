package com.freedomfinance.bank.transaction.domain.models;

import com.freedomfinance.bank.common.models.entities.IEntity;
import com.freedomfinance.bank.common.models.entities.IRecord;
import com.freedomfinance.bank.customer.domain.models.ICustomer;

public interface ITransaction extends IEntity, IRecord {
    ICustomer getCustomer();

    TransactionType getType();

}
