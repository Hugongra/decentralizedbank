package com.freedomfinance.bank.transaction.application.use_cases;

import com.freedomfinance.bank.transaction.infrastructure.controller.dtos.request.TransactionFilterDto;
import com.freedomfinance.bank.transaction.infrastructure.controller.dtos.response.TransactionRto;
import org.springframework.data.domain.Page;

public interface IFindUserTransactions {
    Page<TransactionRto> execute(TransactionFilterDto filter);
}
