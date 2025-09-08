package com.freedomfinance.bank.bank.application.user_cases;

import com.freedomfinance.bank.bank.application.exceptions.BankNotFoundException;
import com.freedomfinance.bank.bank.infrastructure.controller.dtos.response.AssetRto;

import java.util.List;

public interface IGetBankAssets {
    List<AssetRto> execute(String bankPublicKey) throws BankNotFoundException;
}
