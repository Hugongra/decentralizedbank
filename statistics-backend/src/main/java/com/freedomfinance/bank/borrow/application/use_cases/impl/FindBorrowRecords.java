package com.freedomfinance.bank.borrow.application.use_cases.impl;

import com.freedomfinance.bank.borrow.domain.models.IBorrowRecord;
import com.freedomfinance.bank.borrow.domain.services.IBorrowRecordCrudService;
import com.freedomfinance.bank.borrow.infrastructure.controller.dtos.response.BorrowsRecordsRto;
import com.freedomfinance.bank.common.controller.dtos.RecordFilterDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FindBorrowRecords implements com.freedomfinance.bank.borrow.application.use_cases.IFindBorrowRecords {

    private final IBorrowRecordCrudService borrowRecordCrudService;

    @Autowired
    public FindBorrowRecords(IBorrowRecordCrudService borrowRecordCrudService) {
        this.borrowRecordCrudService = borrowRecordCrudService;
    }

    @Override
    public BorrowsRecordsRto execute(String borrowPublicKey, RecordFilterDto filter) {
        List<IBorrowRecord> records = borrowRecordCrudService.findByDate(borrowPublicKey, filter.getTimeUnit());
        return BorrowsRecordsRto.factory(records);
    }

}
