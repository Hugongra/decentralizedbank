package com.freedomfinance.bank.bank.application.exceptions;

import org.springframework.http.HttpStatus;

public class BankNotFoundException extends BankException {

    private final static HttpStatus status = HttpStatus.NOT_FOUND;

    public BankNotFoundException(Long id) {
        super(String.format("Bank with id %s not found", id), status);
    }

    public BankNotFoundException(String publicKey) {
        super(String.format("Bank with public key %s not found", publicKey), status);
    }

}
