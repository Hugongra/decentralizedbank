package com.freedomfinance.bank.borrow.application.use_cases.impl;

import com.freedomfinance.bank.bank.application.exceptions.AssetNotFoundException;
import com.freedomfinance.bank.bank.application.user_cases.IAddAssetRecord;
import com.freedomfinance.bank.bank.domain.models.IAsset;
import com.freedomfinance.bank.bank.domain.services.IAssetCrudService;
import com.freedomfinance.bank.borrow.application.exceptions.BorrowNotFoundException;
import com.freedomfinance.bank.borrow.application.exceptions.BorrowRecordNotFoundException;
import com.freedomfinance.bank.borrow.application.use_cases.IAddBorrowRecord;
import com.freedomfinance.bank.borrow.domain.models.IBorrow;
import com.freedomfinance.bank.borrow.domain.models.IBorrowRecord;
import com.freedomfinance.bank.borrow.domain.services.IBorrowCrudService;
import com.freedomfinance.bank.borrow.domain.services.IBorrowRecordCrudService;
import com.freedomfinance.bank.borrow.infrastructure.controller.dtos.request.BorrowRecordDto;
import com.freedomfinance.bank.borrow.infrastructure.repository.entity.Borrow;
import com.freedomfinance.bank.borrow.infrastructure.repository.entity.BorrowRecord;
import com.freedomfinance.bank.common.models.pojos.HighPrecisionDecimal;
import com.freedomfinance.bank.customer.application.use_cases.IGetOrCreateCustomer;
import com.freedomfinance.bank.customer.domain.models.ICustomer;
import com.freedomfinance.bank.deposit.application.exceptions.DepositNotFoundException;
import com.freedomfinance.bank.log.application.exceptions.SmartContractLogNotFoundException;
import com.freedomfinance.bank.log.application.use_cases.IProcessSmartContractLog;
import com.freedomfinance.bank.token.application.exceptions.TokenPriceRecordNotFoundException;
import com.freedomfinance.bank.token.domain.services.ITokenPriceRecordCrudService;
import com.freedomfinance.bank.transaction.domain.models.TransactionType;
import com.freedomfinance.bank.transaction.domain.services.ITransactionCrudService;
import com.freedomfinance.bank.transaction.infrastructure.repository.entity.BorrowRepayTransaction;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class AddBorrowRecord implements IAddBorrowRecord {

    private final IBorrowCrudService borrowCrudService;
    private final IBorrowRecordCrudService borrowRecordCrudService;
    private final IAssetCrudService assetCrudService;
    private final ITokenPriceRecordCrudService tokenPriceRecordCrudService;
    private final ITransactionCrudService transactionCrudService;
    private final IAddAssetRecord addAssetRecord;
    private final IGetOrCreateCustomer getOrCreateCustomer;
    private final IProcessSmartContractLog processSmartContractLog;

    @Autowired
    public AddBorrowRecord(
            IBorrowCrudService borrowCrudService,
            IBorrowRecordCrudService borrowRecordCrudService,
            IAssetCrudService assetCrudService,
            ITokenPriceRecordCrudService tokenPriceRecordCrudService,
            ITransactionCrudService transactionCrudService,
            IAddAssetRecord addAssetRecord,
            IGetOrCreateCustomer getOrCreateCustomer,
            IProcessSmartContractLog processSmartContractLog) {
        this.borrowCrudService = borrowCrudService;
        this.borrowRecordCrudService = borrowRecordCrudService;
        this.assetCrudService = assetCrudService;
        this.tokenPriceRecordCrudService = tokenPriceRecordCrudService;
        this.transactionCrudService = transactionCrudService;
        this.addAssetRecord = addAssetRecord;
        this.getOrCreateCustomer = getOrCreateCustomer;
        this.processSmartContractLog = processSmartContractLog;
    }

    @Override
    @Transactional(rollbackOn = SmartContractLogNotFoundException.class)
    public void execute(Long logId, BorrowRecordDto borrowRecordDto)
            throws SmartContractLogNotFoundException, BorrowRecordNotFoundException, TokenPriceRecordNotFoundException,
            AssetNotFoundException, DepositNotFoundException {
        IBorrow borrow;
        IAsset borrowAsset;
        IAsset collateralAsset;
        IBorrowRecord lastBorrowRecord = null;

        try {
            borrow = borrowCrudService.get(borrowRecordDto.getBorrowPublicKey());
            borrowAsset = borrow.getBorrowAsset();
            collateralAsset = borrow.getCollateralAsset();
            lastBorrowRecord = borrowRecordCrudService.getLast(borrow.getId());
        } catch (BorrowNotFoundException e) {
            // New Borrow account
            borrowAsset = assetCrudService.get(borrowRecordDto.getBorrowAssetRecord().getPublicKey());
            collateralAsset = assetCrudService.get(borrowRecordDto.getCollateralAssetRecord().getPublicKey());
            ICustomer customer = getOrCreateCustomer.execute(borrowRecordDto.getUserPublicKey());
            borrow = borrowCrudService.save(new Borrow(borrowRecordDto.getBorrowPublicKey(), borrowAsset, collateralAsset, customer));
        }

        HighPrecisionDecimal amount = HighPrecisionDecimal.fromToken(borrowRecordDto.getAmount(), borrowAsset.getToken().getDecimals());
        HighPrecisionDecimal borrowAmount = HighPrecisionDecimal.fromToken(borrowRecordDto.getBorrowAmount(), borrowAsset.getToken().getDecimals());
        HighPrecisionDecimal collateralAmount = HighPrecisionDecimal.fromToken(borrowRecordDto.getCollateralAmount(), collateralAsset.getToken().getDecimals());
        HighPrecisionDecimal borrowValue = HighPrecisionDecimal.fromPrice(tokenPriceRecordCrudService.getLast(borrowAsset.getToken().getId()).getPrice()).multiply(borrowAmount);
        HighPrecisionDecimal collateralValue = HighPrecisionDecimal.fromPrice(tokenPriceRecordCrudService.getLast(collateralAsset.getToken().getId()).getPrice()).multiply(collateralAmount);
        Double borrowRateIndex = HighPrecisionDecimal.fromRate(borrowRecordDto.getBorrowRateIndex()).normalized();

        /* Borrow Record */
        borrowRecordCrudService.save(new BorrowRecord(
                borrow,
                borrowAmount.normalized(),
                borrowValue.normalized(),
                collateralAmount.normalized(),
                collateralValue.normalized(),
                borrowRateIndex));

        // Add Assets Records
        addAssetRecord.execute(borrowAsset, borrowRecordDto.getBorrowAssetRecord());
        if (!collateralAsset.getId().equals(borrowAsset.getId())) {
            addAssetRecord.execute(collateralAsset, borrowRecordDto.getCollateralAssetRecord());
        }

        /* Transaction */
        HighPrecisionDecimal borrowAmountDiff = borrowAmount;
        HighPrecisionDecimal collateralAmountDiff = collateralAmount;
        HighPrecisionDecimal borrowValueDiff = borrowValue;
        HighPrecisionDecimal collateralValueDiff = collateralValue;
        TransactionType transactionType = TransactionType.BORROW;

        if (lastBorrowRecord != null) {
            borrowAmountDiff = borrowAmountDiff.subtract(new HighPrecisionDecimal(lastBorrowRecord.getBorrowAmount(), borrowAsset.getToken().getDecimals()));
            collateralAmountDiff = collateralAmountDiff.subtract(new HighPrecisionDecimal(lastBorrowRecord.getCollateralAmount(), collateralAsset.getToken().getDecimals()));
            borrowValueDiff = borrowValueDiff.subtract(new HighPrecisionDecimal(lastBorrowRecord.getBorrowValue(), HighPrecisionDecimal.PRICE_DECIMALS));
            collateralValueDiff = collateralValueDiff.subtract(new HighPrecisionDecimal(lastBorrowRecord.getCollateralValue(), HighPrecisionDecimal.PRICE_DECIMALS));
            if (borrowAmountDiff.isNegative()) {
                transactionType = TransactionType.REPAY;
                borrowAmountDiff = amount;
                borrowValueDiff = HighPrecisionDecimal.fromPrice(tokenPriceRecordCrudService.getLast(borrowAsset.getToken().getId()).getPrice()).multiply(amount);
            }
        }

        transactionCrudService.save(new BorrowRepayTransaction(
                borrow.getCustomer(),
                transactionType,
                borrowAsset,
                collateralAsset,
                -borrowAmountDiff.normalized(),
                -borrowValueDiff.normalized(),
                -collateralAmountDiff.normalized(),
                -collateralValueDiff.normalized()));

        /* Handle Log */
        processSmartContractLog.execute(logId);
    }

}
