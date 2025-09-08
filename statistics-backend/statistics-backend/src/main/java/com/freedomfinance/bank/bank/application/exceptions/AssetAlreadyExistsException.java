package com.freedomfinance.bank.bank.application.exceptions;

import org.springframework.http.HttpStatus;

public class AssetAlreadyExistsException extends BankException {

    private final static HttpStatus status = HttpStatus.CONFLICT;

    public AssetAlreadyExistsException(String publicKey) {
        super(String.format("Asset with public key %s already exists", publicKey), status);
    }

}
