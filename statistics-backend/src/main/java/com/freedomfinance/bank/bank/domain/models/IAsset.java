package com.freedomfinance.bank.bank.domain.models;

import com.freedomfinance.bank.common.models.entities.IAccount;
import com.freedomfinance.bank.common.models.entities.IEntity;
import com.freedomfinance.bank.token.domain.models.IToken;

public interface IAsset extends IEntity, IAccount {
    IBank getBank();
    IToken getToken();

}
