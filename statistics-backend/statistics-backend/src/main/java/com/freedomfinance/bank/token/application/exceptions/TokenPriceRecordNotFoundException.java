package com.freedomfinance.bank.token.application.exceptions;

import org.springframework.http.HttpStatus;

public class TokenPriceRecordNotFoundException extends TokenException {
    private final static HttpStatus STATUS = HttpStatus.NOT_FOUND;

    public TokenPriceRecordNotFoundException(Long tokenId) {
        super(String.format("Token price record of token id %d not found", tokenId), STATUS);
    }

}
