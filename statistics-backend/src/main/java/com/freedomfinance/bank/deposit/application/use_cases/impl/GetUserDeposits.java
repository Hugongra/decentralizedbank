package com.freedomfinance.bank.deposit.application.use_cases.impl;

import com.freedomfinance.bank.deposit.application.use_cases.IGetUserDeposits;
import com.freedomfinance.bank.deposit.domain.services.IDepositCrudService;
import com.freedomfinance.bank.deposit.infrastructure.controller.dtos.response.DepositRto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class GetUserDeposits implements IGetUserDeposits {

    private final IDepositCrudService depositCrudService;

    @Autowired
    public GetUserDeposits(IDepositCrudService depositCrudService) {
        this.depositCrudService = depositCrudService;
    }

    @Override
    public List<DepositRto> execute(String bankPublicKey, String userPublicKey) {
        return depositCrudService.getAll(bankPublicKey, userPublicKey).stream()
                .map(DepositRto::from)
                .toList();
    }

}
