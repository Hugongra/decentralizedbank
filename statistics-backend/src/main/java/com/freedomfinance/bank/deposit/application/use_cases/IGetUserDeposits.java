package com.freedomfinance.bank.deposit.application.use_cases;

import com.freedomfinance.bank.deposit.infrastructure.controller.dtos.response.DepositRto;

import java.util.List;

public interface IGetUserDeposits {
    List<DepositRto> execute(String bankPublicKey, String userPublicKey);

}
