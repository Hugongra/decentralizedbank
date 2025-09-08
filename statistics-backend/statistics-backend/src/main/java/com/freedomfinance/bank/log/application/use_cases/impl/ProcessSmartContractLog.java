package com.freedomfinance.bank.log.application.use_cases.impl;

import com.freedomfinance.bank.log.application.exceptions.SmartContractLogNotFoundException;
import com.freedomfinance.bank.log.application.use_cases.IProcessSmartContractLog;
import com.freedomfinance.bank.log.domain.models.ISmartContractLog;
import com.freedomfinance.bank.log.domain.services.ISmartContractLogCrudService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class ProcessSmartContractLog implements IProcessSmartContractLog {

    private final ISmartContractLogCrudService smartContractLogCrudService;

    @Autowired
    public ProcessSmartContractLog(ISmartContractLogCrudService smartContractLogCrudService) {
        this.smartContractLogCrudService = smartContractLogCrudService;
    }

    @Override
    public void execute(Long id) throws SmartContractLogNotFoundException {
        ISmartContractLog log = smartContractLogCrudService.get(id);
        log.processed();
        smartContractLogCrudService.save(log);
    }

}
