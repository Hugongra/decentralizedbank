package com.freedomfinance.bank.bank.application.exceptions;

import org.springframework.http.HttpStatus;

public class BankAlreadyExistsException extends BankException {

    private final static HttpStatus status = HttpStatus.CONFLICT;

    public BankAlreadyExistsException(String publicKey) {
        super(String.format("Bank with public key %s already exists", publicKey), status);
    }
}
