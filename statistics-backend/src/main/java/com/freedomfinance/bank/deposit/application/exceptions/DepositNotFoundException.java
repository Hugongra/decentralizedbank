package com.freedomfinance.bank.deposit.application.exceptions;

import org.springframework.http.HttpStatus;

public class DepositNotFoundException extends DepositException {

    private final static HttpStatus status = HttpStatus.NOT_FOUND;

    public DepositNotFoundException(Long id) {
        super(String.format("Deposit with id %d not found", id), status);
    }

    public DepositNotFoundException(String publicKey) {
        super(String.format("Deposit with public key %s not found", publicKey), status);
    }

}
