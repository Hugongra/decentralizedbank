package com.freedomfinance.bank.log.application.exceptions;

import org.springframework.http.HttpStatus;

public class SmartContractLogAlreadyExistsException extends LogException {

    private final static HttpStatus status = HttpStatus.CONFLICT;

    public SmartContractLogAlreadyExistsException(String signature) {
        super(String.format("SmartContractLog with signature %s already exists", signature), status);
    }

}
