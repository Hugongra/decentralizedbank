package com.freedomfinance.bank.borrow.application.use_cases;

import com.freedomfinance.bank.bank.application.exceptions.AssetNotFoundException;
import com.freedomfinance.bank.borrow.application.exceptions.BorrowNotFoundException;
import com.freedomfinance.bank.borrow.application.exceptions.BorrowRecordNotFoundException;
import com.freedomfinance.bank.borrow.infrastructure.controller.dtos.request.BorrowRecordDto;
import com.freedomfinance.bank.deposit.application.exceptions.DepositNotFoundException;
import com.freedomfinance.bank.log.application.exceptions.SmartContractLogNotFoundException;
import com.freedomfinance.bank.token.application.exceptions.TokenPriceRecordNotFoundException;
import jakarta.transaction.Transactional;

public interface IAddBorrowRecord {
    @Transactional(rollbackOn = SmartContractLogNotFoundException.class)
    void execute(Long logId, BorrowRecordDto borrowRecordDto)
            throws BorrowNotFoundException, SmartContractLogNotFoundException, BorrowRecordNotFoundException, TokenPriceRecordNotFoundException, AssetNotFoundException, DepositNotFoundException;

}
