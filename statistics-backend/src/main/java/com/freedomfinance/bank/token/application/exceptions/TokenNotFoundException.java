package com.freedomfinance.bank.token.application.exceptions;

import org.springframework.http.HttpStatus;

public class TokenNotFoundException extends TokenException {

    private final static HttpStatus STATUS = HttpStatus.NOT_FOUND;

    public TokenNotFoundException(Long id) {
        super(String.format("Token with id %d not found", id), STATUS);
    }

    private TokenNotFoundException(String message) {
        super(message, STATUS);
    }

    public static TokenNotFoundException mint(String publicKey) {
        return new TokenNotFoundException(String.format("Token with mint address %s not found", publicKey));
    }

    public static TokenNotFoundException symbol(String symbol) {
        return new TokenNotFoundException(String.format("Token with symbol %s not found", symbol));
    }

}
