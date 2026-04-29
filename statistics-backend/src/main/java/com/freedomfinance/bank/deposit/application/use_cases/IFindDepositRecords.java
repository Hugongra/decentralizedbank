package com.freedomfinance.bank.deposit.application.use_cases;

import com.freedomfinance.bank.common.controller.dtos.RecordFilterDto;
import com.freedomfinance.bank.deposit.infrastructure.controller.dtos.response.DepositRecordsRto;

public interface IFindDepositRecords {
    DepositRecordsRto execute(String depositPublicKey, RecordFilterDto filter);
}
