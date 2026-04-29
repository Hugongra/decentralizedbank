package com.freedomfinance.bank.borrow.domain.services;

import com.freedomfinance.bank.borrow.application.exceptions.BorrowRecordNotFoundException;
import com.freedomfinance.bank.borrow.domain.models.IBorrowRecord;

import java.time.temporal.ChronoUnit;
import java.util.List;

public interface IBorrowRecordCrudService {

    IBorrowRecord getLast(Long borrowId) throws BorrowRecordNotFoundException;

    IBorrowRecord save(IBorrowRecord borrowRecord);

    List<IBorrowRecord> findByDate(String borrowPublicKey, ChronoUnit timeUnit);

}
