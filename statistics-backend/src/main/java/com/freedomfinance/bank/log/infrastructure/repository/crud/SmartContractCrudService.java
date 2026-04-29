package com.freedomfinance.bank.log.infrastructure.repository.crud;

import com.freedomfinance.bank.log.application.exceptions.SmartContractLogNotFoundException;
import com.freedomfinance.bank.log.domain.models.ISmartContractLog;
import com.freedomfinance.bank.log.domain.services.ISmartContractLogCrudService;
import com.freedomfinance.bank.log.infrastructure.repository.entity.SmartContractLog;
import com.freedomfinance.bank.log.infrastructure.repository.jpa.ISmartContractLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SmartContractCrudService implements ISmartContractLogCrudService {

    private final ISmartContractLogRepository repository;

    @Autowired
    public SmartContractCrudService(ISmartContractLogRepository repository) {
        this.repository = repository;
    }

    @Override
    public ISmartContractLog get(Long id) throws SmartContractLogNotFoundException {
        SmartContractLog log = repository.findById(id).orElse(null);
        if (log == null) {
            throw new SmartContractLogNotFoundException(id);
        }
        return log;
    }

    @Override
    public ISmartContractLog get(String signature) throws SmartContractLogNotFoundException {
        SmartContractLog log = repository.findBySignature(signature);
        if (log == null) {
            throw new SmartContractLogNotFoundException(signature);
        }
        return log;
    }
    @Override
    public ISmartContractLog getLast() {
        return repository.findLast();
    }

    @Override
    public List<ISmartContractLog> getAllUnprocessed() {
        return repository.findUnprocessed().stream()
                .map(log -> (ISmartContractLog) log)
                .toList();
    }

    @Override
    public void save(ISmartContractLog log) {
        repository.save((SmartContractLog) log);
    }

}
