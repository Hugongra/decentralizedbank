package com.freedomfinance.bank.token.application.exceptions;

import org.springframework.http.HttpStatus;

public class InvalidTokenMintException extends TokenException {

    private final static HttpStatus STATUS = HttpStatus.NOT_FOUND;

    public InvalidTokenMintException(String mint) {
        super(String.format("Invalid token mint %s", mint), STATUS);
    }

}
