package com.freedomfinance.bank.bank.application.user_cases.impl;

import com.freedomfinance.bank.bank.application.exceptions.BankAlreadyExistsException;
import com.freedomfinance.bank.bank.application.user_cases.ICreateBank;
import com.freedomfinance.bank.bank.domain.services.IBankCrudService;
import com.freedomfinance.bank.bank.infrastructure.controller.dtos.request.CreateBankDto;
import com.freedomfinance.bank.bank.infrastructure.repository.entity.Bank;
import com.freedomfinance.bank.log.application.exceptions.SmartContractLogNotFoundException;
import com.freedomfinance.bank.log.application.use_cases.IProcessSmartContractLog;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class CreateBank implements ICreateBank {

    private final IBankCrudService bankCrudService;
    private final IProcessSmartContractLog processSmartContractLog;

    @Autowired
    public CreateBank(IBankCrudService bankCrudService, IProcessSmartContractLog processSmartContractLog) {
        this.bankCrudService = bankCrudService;
        this.processSmartContractLog = processSmartContractLog;
    }

    @Override
    @Transactional(rollbackOn = SmartContractLogNotFoundException.class)
    public void execute(Long logId, CreateBankDto bankDto) throws BankAlreadyExistsException, SmartContractLogNotFoundException {
        bankCrudService.checkBankExistence(bankDto.getPublicKey());
        bankCrudService.save(new Bank(bankDto.getPublicKey()));
        processSmartContractLog.execute(logId);
    }

}
