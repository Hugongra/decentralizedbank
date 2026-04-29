package com.freedomfinance.bank.borrow.infrastructure.repository.crud;

import com.freedomfinance.bank.borrow.application.exceptions.BorrowRecordNotFoundException;
import com.freedomfinance.bank.borrow.domain.models.IBorrowRecord;
import com.freedomfinance.bank.borrow.domain.services.IBorrowRecordCrudService;
import com.freedomfinance.bank.borrow.infrastructure.repository.entity.BorrowRecord;
import com.freedomfinance.bank.borrow.infrastructure.repository.jpa.IBorrowRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class BorrowRecordCrudService implements IBorrowRecordCrudService {

    private final IBorrowRecordRepository repository;

    @Autowired
    public BorrowRecordCrudService(IBorrowRecordRepository repository) {
        this.repository = repository;
    }

    @Override
    public IBorrowRecord getLast(Long borrowId) throws BorrowRecordNotFoundException {
        IBorrowRecord record = repository.findLast(borrowId);
        if (record == null) {
            throw new BorrowRecordNotFoundException(borrowId);
        }
        return record;
    }

    @Override
    public List<IBorrowRecord> findByDate(String borrowPublicKey, ChronoUnit timeUnit) {
        return repository.findByDate(borrowPublicKey, timeUnit).stream()
                .map(record -> (IBorrowRecord) record)
                .toList();
    }

    @Override
    public IBorrowRecord save(IBorrowRecord borrowRecord) {
        return repository.save((BorrowRecord) borrowRecord);
    }

}
