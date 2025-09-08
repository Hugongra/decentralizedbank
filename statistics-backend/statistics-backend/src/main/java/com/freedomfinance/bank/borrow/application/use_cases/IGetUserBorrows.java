package com.freedomfinance.bank.borrow.application.use_cases;

import com.freedomfinance.bank.borrow.infrastructure.controller.dtos.request.BorrowRto;

import java.util.List;

public interface IGetUserBorrows {
    List<BorrowRto> execute(String bankPublicKey, String userPublicKey);
}
