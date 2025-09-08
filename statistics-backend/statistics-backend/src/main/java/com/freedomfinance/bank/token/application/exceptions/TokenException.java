package com.freedomfinance.bank.token.application.exceptions;

import com.freedomfinance.bank.common.application.exceptions.XException;
import com.freedomfinance.bank.token.TokenDomain;
import org.springframework.http.HttpStatus;

public class TokenException extends XException {

    private final static String DOMAIN = TokenDomain.name;

    public TokenException(String message, HttpStatus status) {
        super(message, DOMAIN, status);
    }

}
