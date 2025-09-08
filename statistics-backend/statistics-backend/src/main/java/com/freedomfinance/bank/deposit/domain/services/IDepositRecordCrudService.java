package com.freedomfinance.bank.deposit.domain.services;

import com.freedomfinance.bank.deposit.domain.models.IDepositRecord;

import java.time.temporal.ChronoUnit;
import java.util.List;

public interface IDepositRecordCrudService {

    IDepositRecord getLast(Long depositId);

    IDepositRecord save(IDepositRecord depositRecord);

    List<IDepositRecord> findByDate(String depositPublicKey, ChronoUnit timeUnit);

}
