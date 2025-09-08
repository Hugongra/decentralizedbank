package com.freedomfinance.bank.customer.domain.models;

import com.freedomfinance.bank.common.models.entities.IEntity;
import com.freedomfinance.bank.common.models.entities.IRecord;

public interface ICustomer extends IEntity, IRecord  {
    String getUserPublicKey();

}
