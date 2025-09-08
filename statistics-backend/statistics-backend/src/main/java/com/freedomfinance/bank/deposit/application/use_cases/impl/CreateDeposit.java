package com.freedomfinance.bank.deposit.application.use_cases.impl;

import com.freedomfinance.bank.bank.application.exceptions.AssetNotFoundException;
import com.freedomfinance.bank.bank.domain.models.IAsset;
import com.freedomfinance.bank.bank.domain.services.IAssetCrudService;
import com.freedomfinance.bank.customer.application.use_cases.IGetOrCreateCustomer;
import com.freedomfinance.bank.customer.domain.models.ICustomer;
import com.freedomfinance.bank.deposit.application.exceptions.DepositAlreadyExistsException;
import com.freedomfinance.bank.deposit.domain.services.IDepositCrudService;
import com.freedomfinance.bank.deposit.infrastructure.controller.dtos.request.CreateDepositDto;
import com.freedomfinance.bank.deposit.infrastructure.repository.entity.Deposit;
import com.freedomfinance.bank.log.application.exceptions.SmartContractLogNotFoundException;
import com.freedomfinance.bank.log.application.use_cases.IProcessSmartContractLog;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class CreateDeposit implements com.freedomfinance.bank.deposit.application.use_cases.ICreateDeposit {

    private final IDepositCrudService depositCrudService;
    private final IAssetCrudService assetCrudService;
    private final IGetOrCreateCustomer getOrCreateCustomer;
    private final IProcessSmartContractLog processSmartContractLog;

    @Autowired
    public CreateDeposit(
            IDepositCrudService depositCrudService,
            IAssetCrudService assetCrudService,
            IGetOrCreateCustomer getOrCreateCustomer,
            IProcessSmartContractLog processSmartContractLog) {
        this.depositCrudService = depositCrudService;
        this.assetCrudService = assetCrudService;
        this.getOrCreateCustomer = getOrCreateCustomer;
        this.processSmartContractLog = processSmartContractLog;
    }

    @Override
    @Transactional(rollbackOn = SmartContractLogNotFoundException.class)
    public void execute(Long logId, CreateDepositDto createDepositDto)
            throws DepositAlreadyExistsException, AssetNotFoundException, SmartContractLogNotFoundException {
        depositCrudService.checkDepositExistence(createDepositDto.getPublicKey());
        IAsset asset = assetCrudService.get(createDepositDto.getAssetPublicKey());
        ICustomer customer = getOrCreateCustomer.execute(createDepositDto.getUserPublicKey());
        Deposit deposit = new Deposit(createDepositDto.getPublicKey(), asset, customer);
        depositCrudService.save(deposit);
        processSmartContractLog.execute(logId);
    }

}
