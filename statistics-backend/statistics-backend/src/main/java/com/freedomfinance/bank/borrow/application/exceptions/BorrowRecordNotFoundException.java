package com.freedomfinance.bank.borrow.application.exceptions;

import org.springframework.http.HttpStatus;

public class BorrowRecordNotFoundException extends BorrowException {

    private final static HttpStatus STATUS = HttpStatus.NOT_FOUND;

    public BorrowRecordNotFoundException(Long borrowId) {
        super(String.format("Borrow record of borrow with id %d not found", borrowId), STATUS);
    }

}
