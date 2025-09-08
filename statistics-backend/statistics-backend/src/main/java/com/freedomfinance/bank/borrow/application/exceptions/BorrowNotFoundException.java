package com.freedomfinance.bank.borrow.application.exceptions;

import org.springframework.http.HttpStatus;

public class BorrowNotFoundException extends BorrowException {
    private final static HttpStatus STATUS = HttpStatus.NOT_FOUND;

    public BorrowNotFoundException(Long id) {
        super(String.format("Borrow with id %d not found", id), STATUS);
    }

    public BorrowNotFoundException(String publicKey) {
        super(String.format("Borrow with public key %s not found", publicKey), STATUS);
    }

}
