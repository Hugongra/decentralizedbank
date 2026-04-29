package com.freedomfinance.bank.borrow.application.exceptions;

import com.freedomfinance.bank.borrow.BorrowDomain;
import com.freedomfinance.bank.common.application.exceptions.XException;
import org.springframework.http.HttpStatus;

public abstract class BorrowException extends XException {

    private final static String DOMAIN = BorrowDomain.name;

    public BorrowException(String message, HttpStatus status) {
        super(message, DOMAIN, status);
    }

}
