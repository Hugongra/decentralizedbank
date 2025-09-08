package com.freedomfinance.bank.token.infrastructure.repository.crud;

import com.freedomfinance.bank.token.application.exceptions.TokenNotFoundException;
import com.freedomfinance.bank.token.domain.models.IToken;
import com.freedomfinance.bank.token.domain.services.ITokenCrudService;
import com.freedomfinance.bank.token.infrastructure.repository.entity.Token;
import com.freedomfinance.bank.token.infrastructure.repository.jpa.ITokenRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TokenCrudService implements ITokenCrudService {

    private final ITokenRepository repository;

    @Autowired
    public TokenCrudService(ITokenRepository repository) {
        this.repository = repository;
    }

    @Override
    public IToken get(Long id) throws TokenNotFoundException {
        IToken token = repository.findById(id).orElse(null);
        if (token == null) {
            throw new TokenNotFoundException(id);
        }
        return token;
    }

    @Override
    public List<IToken> getAll() {
        return repository.findAll().stream()
                .map(token -> (IToken) token)
                .toList();
    }

    @Override
    public IToken getByMint(String mint) throws TokenNotFoundException {
        IToken token = repository.findByMint(mint);
        if (token == null) {
            throw TokenNotFoundException.mint(mint);
        }
        return token;
    }

    @Override
    public IToken getBySymbol(String symbol) throws TokenNotFoundException {
        IToken token = repository.findBySymbol(symbol);
        if (token == null) {
            throw TokenNotFoundException.symbol(symbol);
        }
        return token;
    }

    @Override
    public IToken save(IToken token) {
        return repository.save((Token) token);
    }

}
