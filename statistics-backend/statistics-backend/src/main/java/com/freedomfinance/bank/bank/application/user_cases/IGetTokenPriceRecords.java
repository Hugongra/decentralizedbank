package com.freedomfinance.bank.bank.application.user_cases;

import com.freedomfinance.bank.bank.application.exceptions.BankNotFoundException;
import com.freedomfinance.bank.bank.infrastructure.controller.dtos.response.TokenPriceRecordVM;

import java.util.List;

public interface IGetTokenPriceRecords {
    List<TokenPriceRecordVM> execute(String bankPublicKey) throws BankNotFoundException;
}
