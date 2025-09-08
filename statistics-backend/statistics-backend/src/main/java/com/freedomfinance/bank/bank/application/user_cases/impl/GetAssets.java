package com.freedomfinance.bank.bank.application.user_cases.impl;

import com.freedomfinance.bank.bank.application.exceptions.BankNotFoundException;
import com.freedomfinance.bank.bank.application.user_cases.IGetBankAssets;
import com.freedomfinance.bank.bank.domain.models.IBank;
import com.freedomfinance.bank.bank.domain.services.IBankCrudService;
import com.freedomfinance.bank.bank.infrastructure.controller.dtos.response.AssetRto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class GetAssets implements IGetBankAssets {

    private final IBankCrudService bankCrudService;

    @Autowired
    public GetAssets(IBankCrudService bankCrudService) {
        this.bankCrudService = bankCrudService;
    }

    @Override
    public List<AssetRto> execute(String bankPublicKey) throws BankNotFoundException {
        IBank bank = bankCrudService.get(bankPublicKey);
        return bank.getAssets().stream()
                .map(AssetRto::from)
                .toList();
    }

}
