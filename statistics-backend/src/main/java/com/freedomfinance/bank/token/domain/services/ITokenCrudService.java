package com.freedomfinance.bank.token.domain.services;

import com.freedomfinance.bank.token.application.exceptions.TokenNotFoundException;
import com.freedomfinance.bank.token.domain.models.IToken;

import java.util.List;

public interface ITokenCrudService {

    IToken get(Long id) throws TokenNotFoundException;
    List<IToken> getAll();

    IToken getByMint(String mint) throws TokenNotFoundException;

    IToken getBySymbol(String symbol) throws TokenNotFoundException;

    IToken save(IToken token);

}
