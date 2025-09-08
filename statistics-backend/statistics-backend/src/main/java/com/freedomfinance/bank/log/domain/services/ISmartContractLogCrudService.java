package com.freedomfinance.bank.log.domain.services;

import com.freedomfinance.bank.log.application.exceptions.SmartContractLogAlreadyExistsException;
import com.freedomfinance.bank.log.application.exceptions.SmartContractLogNotFoundException;
import com.freedomfinance.bank.log.domain.models.ISmartContractLog;

import java.util.List;

public interface ISmartContractLogCrudService {

    ISmartContractLog get(Long id) throws SmartContractLogNotFoundException;

    ISmartContractLog get(String signature) throws SmartContractLogNotFoundException;

    ISmartContractLog getLast();

    List<ISmartContractLog> getAllUnprocessed();

    void save(ISmartContractLog log);

    default void checkExistence(String signature) throws SmartContractLogAlreadyExistsException {
        try {
            get(signature);
            throw new SmartContractLogAlreadyExistsException(signature);
        } catch (SmartContractLogNotFoundException ignored) {}
    }

}
