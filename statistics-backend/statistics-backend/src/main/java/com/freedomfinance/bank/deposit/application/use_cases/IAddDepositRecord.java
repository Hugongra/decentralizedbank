package com.freedomfinance.bank.deposit.application.use_cases;

import com.freedomfinance.bank.bank.application.exceptions.AssetNotFoundException;
import com.freedomfinance.bank.deposit.application.exceptions.DepositNotFoundException;
import com.freedomfinance.bank.deposit.application.exceptions.DepositRecordNotFoundException;
import com.freedomfinance.bank.deposit.infrastructure.controller.dtos.request.AddDepositRecordDto;
import com.freedomfinance.bank.log.application.exceptions.SmartContractLogNotFoundException;
import com.freedomfinance.bank.token.application.exceptions.TokenPriceRecordNotFoundException;
import jakarta.transaction.Transactional;

public interface IAddDepositRecord {
    @Transactional(rollbackOn = DepositNotFoundException.class)
    void execute(Long logId, AddDepositRecordDto addDepositRecordDto)
            throws DepositNotFoundException, SmartContractLogNotFoundException, AssetNotFoundException, TokenPriceRecordNotFoundException, DepositRecordNotFoundException;

}
