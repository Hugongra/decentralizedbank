package com.freedomfinance.bank.deposit.application.exceptions;

import com.freedomfinance.bank.common.application.exceptions.XException;
import com.freedomfinance.bank.deposit.DepositDomain;
import org.springframework.http.HttpStatus;

public abstract class DepositException extends XException {

    private final static String DOMAIN = DepositDomain.name;

    public DepositException(String message, HttpStatus status) {
        super(message, DOMAIN, status);
    }

}
