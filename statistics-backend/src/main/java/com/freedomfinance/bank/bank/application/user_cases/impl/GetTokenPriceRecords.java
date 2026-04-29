package com.freedomfinance.bank.bank.application.user_cases.impl;

import com.freedomfinance.bank.bank.application.exceptions.BankNotFoundException;
import com.freedomfinance.bank.bank.application.user_cases.IGetTokenPriceRecords;
import com.freedomfinance.bank.bank.domain.models.IBank;
import com.freedomfinance.bank.bank.domain.services.IBankCrudService;
import com.freedomfinance.bank.bank.infrastructure.controller.dtos.response.TokenPriceRecordVM;
import com.freedomfinance.bank.token.domain.services.ITokenPriceRecordCrudService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;

@Service
public class GetTokenPriceRecords implements IGetTokenPriceRecords {

    private final IBankCrudService bankCrudService;
    private final ITokenPriceRecordCrudService tokenPriceRecordCrudService;

    @Autowired
    public GetTokenPriceRecords(IBankCrudService bankCrudService, ITokenPriceRecordCrudService tokenPriceRecordCrudService) {
        this.bankCrudService = bankCrudService;
        this.tokenPriceRecordCrudService = tokenPriceRecordCrudService;
    }

    @Override
    public List<TokenPriceRecordVM> execute(String bankPublicKey) throws BankNotFoundException {
        IBank bank = bankCrudService.get(bankPublicKey);
        return bank.getAssets().stream()
                .map(i -> {
                    try {
                        return tokenPriceRecordCrudService.getLast(i.getToken().getId());
                    } catch (Exception e) {
                        return null;
                    }
                })
                .filter(Objects::nonNull)
                .map(i -> new TokenPriceRecordVM(i.getToken().getId(), i.getPrice(), i.getTimestamp().getTime()))
                .toList();
    }
}
