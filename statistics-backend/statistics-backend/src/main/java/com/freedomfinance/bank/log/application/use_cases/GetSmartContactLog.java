package com.freedomfinance.bank.log.application.use_cases;

import com.freedomfinance.bank.log.application.exceptions.SmartContractLogNotFoundException;
import com.freedomfinance.bank.log.domain.models.ISmartContractLog;
import com.freedomfinance.bank.log.domain.services.ISmartContractLogCrudService;
import com.freedomfinance.bank.log.infrastructure.controller.dtos.SmartContractDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class GetSmartContactLog {

    private final ISmartContractLogCrudService smartContractLogCrudService;

    @Autowired
    public GetSmartContactLog(ISmartContractLogCrudService smartContractLogCrudService) {
        this.smartContractLogCrudService = smartContractLogCrudService;
    }

    public SmartContractDto get(Long id) throws SmartContractLogNotFoundException {
        ISmartContractLog log = smartContractLogCrudService.get(id);
        return new SmartContractDto(log.getId(), log.getSignature(), log.getError(), log.getProcessed());
    }

    public SmartContractDto get(String signature) throws SmartContractLogNotFoundException {
        ISmartContractLog log = smartContractLogCrudService.get(signature);
        return new SmartContractDto(log.getId(), log.getSignature(), log.getError(), log.getProcessed());
    }

    public SmartContractDto getLast() {
        ISmartContractLog log = smartContractLogCrudService.getLast();
        if (log == null) {
            return null;
        }
        return new SmartContractDto(log.getId(), log.getSignature(), log.getError(), log.getProcessed());
    }

    public List<SmartContractDto> getUnprocessed() {
        List<ISmartContractLog> logs = smartContractLogCrudService.getAllUnprocessed();
        return logs.stream()
                .map(log -> new SmartContractDto(log.getId(), log.getSignature(), null, null))
                .toList();
    }

}
