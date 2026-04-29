package com.freedomfinance.bank.bank.application.exceptions;

import org.springframework.http.HttpStatus;

public class AssetNotFoundException extends BankException {
    private final static HttpStatus status = HttpStatus.NOT_FOUND;

    public AssetNotFoundException(Long id) {
        super(String.format("Asset with id %d not found", id), status);
    }

    public AssetNotFoundException(String publicKey) {
        super(String.format("Asset with public key %s not found", publicKey), status);
    }

}
