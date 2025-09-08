package com.freedomfinance.bank.deposit.application.use_cases.impl;

import com.freedomfinance.bank.bank.application.user_cases.IAddAssetRecord;
import com.freedomfinance.bank.bank.domain.models.IAsset;
import com.freedomfinance.bank.common.models.pojos.HighPrecisionDecimal;
import com.freedomfinance.bank.deposit.application.exceptions.DepositNotFoundException;
import com.freedomfinance.bank.deposit.application.exceptions.DepositRecordNotFoundException;
import com.freedomfinance.bank.deposit.application.use_cases.IAddDepositRecord;
import com.freedomfinance.bank.deposit.domain.models.IDeposit;
import com.freedomfinance.bank.deposit.domain.models.IDepositRecord;
import com.freedomfinance.bank.deposit.domain.services.IDepositCrudService;
import com.freedomfinance.bank.deposit.domain.services.IDepositRecordCrudService;
import com.freedomfinance.bank.deposit.infrastructure.controller.dtos.request.AddDepositRecordDto;
import com.freedomfinance.bank.deposit.infrastructure.repository.entity.DepositRecord;
import com.freedomfinance.bank.log.application.exceptions.SmartContractLogNotFoundException;
import com.freedomfinance.bank.log.application.use_cases.IProcessSmartContractLog;
import com.freedomfinance.bank.token.application.exceptions.TokenPriceRecordNotFoundException;
import com.freedomfinance.bank.token.domain.models.IToken;
import com.freedomfinance.bank.token.domain.models.ITokenPriceRecord;
import com.freedomfinance.bank.token.domain.services.ITokenPriceRecordCrudService;
import com.freedomfinance.bank.transaction.domain.models.TransactionType;
import com.freedomfinance.bank.transaction.domain.services.ITransactionCrudService;
import com.freedomfinance.bank.transaction.infrastructure.repository.entity.DepositWithdrawTransaction;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class AddDepositRecord implements IAddDepositRecord {
    private final IDepositCrudService depositCrudService;
    private final IDepositRecordCrudService depositRecordCrudService;
    private final ITokenPriceRecordCrudService tokenPriceRecordCrudService;
    private final ITransactionCrudService transactionCrudService;
    private final IAddAssetRecord addAssetRecord;
    private final IProcessSmartContractLog processSmartContractLog;

    @Autowired
    public AddDepositRecord(
            IDepositCrudService depositCrudService,
            IDepositRecordCrudService depositRecordCrudService,
            ITokenPriceRecordCrudService tokenPriceRecordCrudService,
            ITransactionCrudService transactionCrudService,
            IAddAssetRecord addAssetRecord,
            IProcessSmartContractLog processSmartContractLog) {
        this.depositCrudService = depositCrudService;
        this.depositRecordCrudService = depositRecordCrudService;
        this.tokenPriceRecordCrudService = tokenPriceRecordCrudService;
        this.transactionCrudService = transactionCrudService;
        this.addAssetRecord = addAssetRecord;
        this.processSmartContractLog = processSmartContractLog;
    }

    @Override
    @Transactional(rollbackOn = SmartContractLogNotFoundException.class)
    public void execute(Long logId, AddDepositRecordDto addDepositRecordDto)
            throws DepositNotFoundException, DepositRecordNotFoundException, TokenPriceRecordNotFoundException, SmartContractLogNotFoundException {
        IDeposit deposit = depositCrudService.get(addDepositRecordDto.getDepositPublicKey());
        IAsset asset = deposit.getAsset();
        IToken token = asset.getToken();
        ITokenPriceRecord priceRecord = tokenPriceRecordCrudService.getLast(token.getId());
        IDepositRecord lastDepositRecord = depositRecordCrudService.getLast(deposit.getId());

        HighPrecisionDecimal amount = HighPrecisionDecimal.fromToken(addDepositRecordDto.getAmount(), token.getDecimals());
        HighPrecisionDecimal depositAmount = HighPrecisionDecimal.fromToken(addDepositRecordDto.getDepositAmount(), token.getDecimals());
        HighPrecisionDecimal depositValue = HighPrecisionDecimal.fromPrice(priceRecord.getPrice()).multiply(depositAmount);
        Double depositRateIndex = HighPrecisionDecimal.fromRate(addDepositRecordDto.getDepositRateIndex()).normalized();

        /* Deposit Record */
        depositRecordCrudService.save(new DepositRecord(
                deposit,
                depositAmount.normalized(),
                depositValue.normalized(),
                depositRateIndex));

        /* Asset Record */
        addAssetRecord.execute(asset, addDepositRecordDto.getAssetRecord());

        /* Transaction */
        HighPrecisionDecimal depositAmountDiff = depositAmount;
        HighPrecisionDecimal depositValueDiff = depositValue;
        TransactionType transactionType = TransactionType.DEPOSIT;

        if (lastDepositRecord != null) {
            depositAmountDiff = depositAmount.subtract(new HighPrecisionDecimal(lastDepositRecord.getDepositAmount(), token.getDecimals()));
            depositValueDiff = depositValue.subtract(new HighPrecisionDecimal(lastDepositRecord.getDepositValue(), HighPrecisionDecimal.PRICE_DECIMALS));
        } else {
            if (depositAmountDiff.isNegative()) {
                transactionType = TransactionType.WITHDRAW;
                depositAmountDiff = amount;
                depositValueDiff = HighPrecisionDecimal.fromPrice(tokenPriceRecordCrudService.getLast(asset.getToken().getId()).getPrice()).multiply(amount);
            }
        }
        transactionCrudService.save(new DepositWithdrawTransaction(
                deposit.getCustomer(),
                transactionType,
                asset,
                -depositAmountDiff.normalized(),
                -depositValueDiff.normalized()));

        /* Log */
        processSmartContractLog.execute(logId);
    }

}
