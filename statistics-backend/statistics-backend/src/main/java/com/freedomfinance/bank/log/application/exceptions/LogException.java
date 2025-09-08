package com.freedomfinance.bank.log.application.exceptions;

import com.freedomfinance.bank.common.application.exceptions.XException;
import com.freedomfinance.bank.log.LogDomain;
import org.springframework.http.HttpStatus;

public class LogException extends XException {

    private final static String DOMAIN = LogDomain.name;

    public LogException(String message, HttpStatus status) {
        super(message, DOMAIN, status);
    }

}
