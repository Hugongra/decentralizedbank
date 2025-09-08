package com.freedomfinance.bank.token.domain.models;

import com.freedomfinance.bank.common.models.entities.IEntity;
import com.freedomfinance.bank.common.models.entities.IRecord;

public interface ITokenPriceRecord extends IEntity, IRecord {

    IToken getToken();

    Double getPrice();

}
