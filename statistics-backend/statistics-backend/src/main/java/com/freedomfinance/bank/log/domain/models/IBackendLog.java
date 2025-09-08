package com.freedomfinance.bank.log.domain.models;

import com.freedomfinance.bank.common.models.entities.IRecord;

public interface IBackendLog extends IRecord {

    String getDomain();
    String getMessage();

}
