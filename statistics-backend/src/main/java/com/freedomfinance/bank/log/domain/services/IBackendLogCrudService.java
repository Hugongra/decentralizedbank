package com.freedomfinance.bank.log.domain.services;

import com.freedomfinance.bank.log.domain.models.IBackendLog;

public interface IBackendLogCrudService {
    void save(IBackendLog log);
}
