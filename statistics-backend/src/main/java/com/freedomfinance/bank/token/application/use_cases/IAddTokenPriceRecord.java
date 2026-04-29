package com.freedomfinance.bank.token.application.use_cases;

import com.freedomfinance.bank.token.domain.models.IToken;

public interface IAddTokenPriceRecord {

    void execute(IToken token, Double price);

}
