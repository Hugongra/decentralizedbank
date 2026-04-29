package com.freedomfinance.bank.borrow.application.exceptions;

import org.springframework.http.HttpStatus;

public class BorrowAlreadyExistsException extends BorrowException {
    private final static HttpStatus STATUS = HttpStatus.CONFLICT;

    public BorrowAlreadyExistsException(String publicKey) {
        super(String.format("Borrow with public key %s already exists", publicKey), STATUS);
    }

}
