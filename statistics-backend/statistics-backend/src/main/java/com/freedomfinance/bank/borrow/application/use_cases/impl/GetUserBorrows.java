package com.freedomfinance.bank.borrow.application.use_cases.impl;

import com.freedomfinance.bank.borrow.application.use_cases.IGetUserBorrows;
import com.freedomfinance.bank.borrow.domain.services.IBorrowCrudService;
import com.freedomfinance.bank.borrow.infrastructure.controller.dtos.request.BorrowRto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class GetUserBorrows implements IGetUserBorrows {

    private final IBorrowCrudService borrowCrudService;

    @Autowired
    public GetUserBorrows(IBorrowCrudService borrowCrudService) {
        this.borrowCrudService = borrowCrudService;
    }

    @Override
    public List<BorrowRto> execute(String bankPublicKey, String userPublicKey) {
        return borrowCrudService.getAll(bankPublicKey, userPublicKey).stream()
                .map(BorrowRto::from)
                .toList();
    }

}
