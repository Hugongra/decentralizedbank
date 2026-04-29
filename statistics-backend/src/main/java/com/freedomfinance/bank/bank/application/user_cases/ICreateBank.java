package com.freedomfinance.bank.bank.application.user_cases;

import com.freedomfinance.bank.bank.application.exceptions.BankAlreadyExistsException;
import com.freedomfinance.bank.bank.infrastructure.controller.dtos.request.CreateBankDto;
import com.freedomfinance.bank.log.application.exceptions.SmartContractLogNotFoundException;
import jakarta.transaction.Transactional;

public interface ICreateBank {
    @Transactional(rollbackOn = SmartContractLogNotFoundException.class)
    void execute(Long logId, CreateBankDto bankDto) throws BankAlreadyExistsException, SmartContractLogNotFoundException;

}
