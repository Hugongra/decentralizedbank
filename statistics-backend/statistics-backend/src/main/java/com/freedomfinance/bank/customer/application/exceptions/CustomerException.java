package com.freedomfinance.bank.customer.application.exceptions;

import com.freedomfinance.bank.borrow.BorrowDomain;
import com.freedomfinance.bank.common.application.exceptions.XException;
import org.springframework.http.HttpStatus;

public abstract class CustomerException extends XException  {

    private final static String DOMAIN = BorrowDomain.name;

    public CustomerException(String message, HttpStatus status) {
        super(message, DOMAIN, status);
    }

}
