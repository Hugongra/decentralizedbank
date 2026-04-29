package com.freedomfinance.bank.transaction.domain.services;

import com.freedomfinance.bank.transaction.domain.models.ITransaction;
import com.freedomfinance.bank.transaction.infrastructure.controller.dtos.request.TransactionFilterDto;
import org.springframework.data.domain.Page;

public interface ITransactionCrudService {

    Page<ITransaction> find(TransactionFilterDto filter);

    ITransaction save(ITransaction transaction);

}
