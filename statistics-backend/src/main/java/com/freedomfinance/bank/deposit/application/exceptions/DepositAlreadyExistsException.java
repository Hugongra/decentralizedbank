package com.freedomfinance.bank.deposit.application.exceptions;

import org.springframework.http.HttpStatus;

public class DepositAlreadyExistsException extends DepositException {

    private final static HttpStatus status = HttpStatus.CONFLICT;

    public DepositAlreadyExistsException(String publicKey) {
        super(String.format("Deposit with public key %s already exists", publicKey), status);
    }

}
