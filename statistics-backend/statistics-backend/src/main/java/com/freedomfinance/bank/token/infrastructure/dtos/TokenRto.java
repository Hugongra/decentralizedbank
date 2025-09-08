package com.freedomfinance.bank.token.infrastructure.dtos;

import com.freedomfinance.bank.token.domain.models.IToken;
import lombok.Getter;

@Getter
public class TokenRto {

    private String symbol;

    private String logoUrl;

    private Short decimals;

    public TokenRto(IToken token) {
        this.symbol = token.getSymbol();
        this.logoUrl = token.getLogoUrl();
        this.decimals = token.getDecimals();
    }

}
