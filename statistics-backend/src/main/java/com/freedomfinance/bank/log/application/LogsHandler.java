package com.freedomfinance.bank.log.application;

import com.freedomfinance.bank.log.application.exceptions.SmartContractLogAlreadyExistsException;
import com.freedomfinance.bank.log.application.exceptions.SmartContractLogNotFoundException;
import com.freedomfinance.bank.log.application.use_cases.GetSmartContactLog;
import com.freedomfinance.bank.log.application.use_cases.SaveSmartContractLog;
import com.freedomfinance.bank.log.infrastructure.controller.dtos.SmartContractDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class LogsHandler {

    private final GetSmartContactLog getSmartContactLog;

    private final SaveSmartContractLog saveSmartContractLog;

    @Autowired
    public LogsHandler(
            GetSmartContactLog getSmartContactLog,
            SaveSmartContractLog saveSmartContractLog) {
        this.getSmartContactLog = getSmartContactLog;
        this.saveSmartContractLog = saveSmartContractLog;
    }

    public SmartContractDto getSmartContractLog(Long id) throws SmartContractLogNotFoundException {
        return getSmartContactLog.get(id);
    }

    public SmartContractDto getSmartContractLog(String signature) throws SmartContractLogNotFoundException {
        return getSmartContactLog.get(signature);
    }

    public SmartContractDto getLast() {
        return getSmartContactLog.getLast();
    }

    public List<SmartContractDto> getSmartContractUnprocessedLogs() {
        return getSmartContactLog.getUnprocessed();
    }

    public void createSmartContractLog(SmartContractDto smartContractDto) throws SmartContractLogAlreadyExistsException {
        saveSmartContractLog.create(smartContractDto);
    }

    public void processSmartContractLog(Long id) throws SmartContractLogNotFoundException {
        saveSmartContractLog.process(id);
    }

}
