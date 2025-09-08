package com.freedomfinance.bank.borrow.application.use_cases;

import com.freedomfinance.bank.borrow.infrastructure.controller.dtos.response.BorrowsRecordsRto;
import com.freedomfinance.bank.common.controller.dtos.RecordFilterDto;

public interface IFindBorrowRecords {
    BorrowsRecordsRto execute(String borrowPublicKey, RecordFilterDto filter);
}
