package com.freedomfinance.bank.deposit.application.use_cases;

import com.freedomfinance.bank.bank.application.exceptions.AssetNotFoundException;
import com.freedomfinance.bank.deposit.application.exceptions.DepositAlreadyExistsException;
import com.freedomfinance.bank.deposit.infrastructure.controller.dtos.request.CreateDepositDto;
import com.freedomfinance.bank.log.application.exceptions.SmartContractLogNotFoundException;
import jakarta.transaction.Transactional;

public interface ICreateDeposit {
    @Transactional(rollbackOn = SmartContractLogNotFoundException.class)
    void execute(Long logId, CreateDepositDto createDepositDto)
            throws DepositAlreadyExistsException, AssetNotFoundException, SmartContractLogNotFoundException;
}
