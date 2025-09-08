package com.freedomfinance.bank.deposit.application.use_cases.impl;

import com.freedomfinance.bank.common.controller.dtos.RecordFilterDto;
import com.freedomfinance.bank.deposit.domain.models.IDepositRecord;
import com.freedomfinance.bank.deposit.domain.services.IDepositRecordCrudService;
import com.freedomfinance.bank.deposit.infrastructure.controller.dtos.response.DepositRecordsRto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FindDepositRecords implements com.freedomfinance.bank.deposit.application.use_cases.IFindDepositRecords {

    private final IDepositRecordCrudService depositRecordCrudService;

    @Autowired
    public FindDepositRecords(IDepositRecordCrudService depositRecordCrudService) {
        this.depositRecordCrudService = depositRecordCrudService;
    }

    @Override
    public DepositRecordsRto execute(String depositPublicKey, RecordFilterDto filter) {
        List<IDepositRecord> records = depositRecordCrudService.findByDate(depositPublicKey, filter.getTimeUnit());
        return DepositRecordsRto.factory(records);
    }

}
