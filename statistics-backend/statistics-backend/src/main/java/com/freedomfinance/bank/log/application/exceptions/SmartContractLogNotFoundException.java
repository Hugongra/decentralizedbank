package com.freedomfinance.bank.log.application.exceptions;

import org.springframework.http.HttpStatus;

public class SmartContractLogNotFoundException extends LogException {

    private final static HttpStatus status = HttpStatus.NOT_FOUND;

    public SmartContractLogNotFoundException(Long id) {
        super(String.format("SmartContractLog with id %d not found", id), status);
    }

    public SmartContractLogNotFoundException(String signature) {
        super(String.format("SmartContractLog with signature %s not found", signature), status);
    }

}
