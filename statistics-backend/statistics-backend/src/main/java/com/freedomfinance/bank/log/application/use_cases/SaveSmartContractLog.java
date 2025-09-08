package com.freedomfinance.bank.log.application.use_cases;

import com.freedomfinance.bank.log.application.exceptions.SmartContractLogAlreadyExistsException;
import com.freedomfinance.bank.log.application.exceptions.SmartContractLogNotFoundException;
import com.freedomfinance.bank.log.domain.models.ISmartContractLog;
import com.freedomfinance.bank.log.domain.services.ISmartContractLogCrudService;
import com.freedomfinance.bank.log.infrastructure.controller.dtos.SmartContractDto;
import com.freedomfinance.bank.log.infrastructure.repository.entity.SmartContractLog;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class SaveSmartContractLog {

    private final ISmartContractLogCrudService smartContractLogCrudService;

    @Autowired
    public SaveSmartContractLog(ISmartContractLogCrudService smartContractLogCrudService) {
        this.smartContractLogCrudService = smartContractLogCrudService;
    }

    public void create(SmartContractDto smartContractDto) throws SmartContractLogAlreadyExistsException {
        smartContractLogCrudService.checkExistence(smartContractDto.getSignature());
        smartContractLogCrudService.save(new SmartContractLog(smartContractDto.getSignature(), smartContractDto.getError()));
    }

    public void process(Long id) throws SmartContractLogNotFoundException {
        ISmartContractLog log = smartContractLogCrudService.get(id);
        log.processed();
        smartContractLogCrudService.save(log);
    }

}
