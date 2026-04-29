package com.freedomfinance.bank.token.domain.models;

import com.freedomfinance.bank.common.models.entities.IEntity;

public interface IToken extends IEntity {

    String getSymbol();

    String getMint();

    Short getDecimals();

    String getLogoUrl();

}
