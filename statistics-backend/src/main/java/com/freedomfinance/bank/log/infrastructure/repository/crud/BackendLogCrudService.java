package com.freedomfinance.bank.log.infrastructure.repository.crud;

import com.freedomfinance.bank.log.domain.models.IBackendLog;
import com.freedomfinance.bank.log.infrastructure.repository.entity.BackendLog;
import com.freedomfinance.bank.log.infrastructure.repository.jpa.IBackendLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class BackendLogCrudService implements com.freedomfinance.bank.log.domain.services.IBackendLogCrudService {

    private final IBackendLogRepository repository;

    @Autowired
    public BackendLogCrudService(IBackendLogRepository repository) {
        this.repository = repository;
    }

    @Override
    public void save(IBackendLog log) {
        repository.save((BackendLog) log);
    }


}
