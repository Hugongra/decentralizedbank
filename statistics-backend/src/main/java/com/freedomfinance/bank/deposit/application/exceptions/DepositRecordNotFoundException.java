package com.freedomfinance.bank.deposit.application.exceptions;

import org.springframework.http.HttpStatus;

public class DepositRecordNotFoundException extends DepositException {

    private final static HttpStatus status = HttpStatus.NOT_FOUND;

    public DepositRecordNotFoundException(Long depositId) {
        super(String.format("Deposit record of deposit with id %d not found", depositId), status);
    }

}
