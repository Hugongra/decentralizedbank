package com.freedomfinance.bank.log.domain.models;

import com.freedomfinance.bank.common.models.entities.IEntity;
import com.freedomfinance.bank.common.models.entities.IRecord;

public interface ISmartContractLog extends IEntity, IRecord {

    String getSignature();

    Boolean getError();

    Boolean getProcessed();

    void processed();

}
