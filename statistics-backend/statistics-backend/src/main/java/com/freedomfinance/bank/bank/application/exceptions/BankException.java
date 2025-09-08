package com.freedomfinance.bank.bank.application.exceptions;

import com.freedomfinance.bank.bank.BankDomain;
import com.freedomfinance.bank.common.application.exceptions.XException;
import org.springframework.http.HttpStatus;

public abstract class BankException extends XException {

    private final static String DOMAIN = BankDomain.name;

    public BankException(String message, HttpStatus status) {
        super(message, DOMAIN, status);
    }

}
