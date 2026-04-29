package com.freedomfinance.bank.customer.application.exceptions;

import org.springframework.http.HttpStatus;

public class CustomerNotFoundException extends CustomerException {

    private final static HttpStatus STATUS = HttpStatus.NOT_FOUND;

    public CustomerNotFoundException(String publicKey) {
        super(String.format("Customer with public key %s not found", publicKey), STATUS);
    }

}
