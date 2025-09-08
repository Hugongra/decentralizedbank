package com.freedomfinance.bank.transaction.application.use_cases.impl;

import com.freedomfinance.bank.transaction.application.use_cases.IFindUserTransactions;
import com.freedomfinance.bank.transaction.domain.models.IBorrowRepayTransaction;
import com.freedomfinance.bank.transaction.domain.models.IDepositWithdrawTransaction;
import com.freedomfinance.bank.transaction.domain.services.ITransactionCrudService;
import com.freedomfinance.bank.transaction.infrastructure.controller.dtos.request.TransactionFilterDto;
import com.freedomfinance.bank.transaction.infrastructure.controller.dtos.response.BorrowRepayTransactionRto;
import com.freedomfinance.bank.transaction.infrastructure.controller.dtos.response.DepositWithdrawTransactionRto;
import com.freedomfinance.bank.transaction.infrastructure.controller.dtos.response.TransactionRto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;

@Service
public class FindUserTransactions implements IFindUserTransactions {

    private final ITransactionCrudService transactionCrudService;

    @Autowired
    public FindUserTransactions(ITransactionCrudService transactionCrudService) {
        this.transactionCrudService = transactionCrudService;
    }

    @Override
    public Page<TransactionRto> execute(TransactionFilterDto filter) {
        return transactionCrudService.find(filter).map(i -> {
            if (i instanceof IDepositWithdrawTransaction depositWithdrawTransaction) {
                return new DepositWithdrawTransactionRto(depositWithdrawTransaction);
            } else {
                return new BorrowRepayTransactionRto((IBorrowRepayTransaction) i);
            }
        });
    }

}
