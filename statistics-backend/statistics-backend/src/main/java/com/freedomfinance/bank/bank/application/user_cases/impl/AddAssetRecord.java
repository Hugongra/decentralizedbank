package com.freedomfinance.bank.bank.application.user_cases.impl;

import com.freedomfinance.bank.bank.application.exceptions.AssetNotFoundException;
import com.freedomfinance.bank.bank.application.user_cases.IAddAssetRecord;
import com.freedomfinance.bank.bank.domain.models.IAsset;
import com.freedomfinance.bank.bank.domain.models.IAssetRecord;
import com.freedomfinance.bank.bank.domain.services.IAssetCrudService;
import com.freedomfinance.bank.bank.domain.services.IAssetRecordCrudService;
import com.freedomfinance.bank.bank.infrastructure.controller.dtos.request.AddAssetRecordDto;
import com.freedomfinance.bank.bank.infrastructure.repository.entity.AssetRecord;
import com.freedomfinance.bank.common.models.pojos.HighPrecisionDecimal;
import com.freedomfinance.bank.token.application.exceptions.TokenPriceRecordNotFoundException;
import com.freedomfinance.bank.token.domain.models.IToken;
import com.freedomfinance.bank.token.domain.models.ITokenPriceRecord;
import com.freedomfinance.bank.token.domain.services.ITokenPriceRecordCrudService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;

@Service
public class AddAssetRecord implements IAddAssetRecord {
    private final IAssetCrudService assetCrudService;
    private final IAssetRecordCrudService assetRecordCrudService;
    private final ITokenPriceRecordCrudService tokenPriceRecordCrudService;

    @Autowired
    public AddAssetRecord(
            IAssetCrudService assetCrudService,
            IAssetRecordCrudService assetRecordCrudService,
            ITokenPriceRecordCrudService tokenPriceRecordCrudService) {
        this.assetCrudService = assetCrudService;
        this.assetRecordCrudService = assetRecordCrudService;
        this.tokenPriceRecordCrudService = tokenPriceRecordCrudService;
    }

    @Override
    public void execute(IAsset asset, AddAssetRecordDto assetRecordDto) throws TokenPriceRecordNotFoundException {
        IToken token = asset.getToken();
        ITokenPriceRecord tokenPriceRecord = tokenPriceRecordCrudService.getLast(token.getId());
        HighPrecisionDecimal price = HighPrecisionDecimal.fromPrice(tokenPriceRecord.getPrice());
        HighPrecisionDecimal depositAmount = HighPrecisionDecimal.fromToken(assetRecordDto.getDepositAmount(), token.getDecimals());
        Double depositValue = HighPrecisionDecimal.multiply(price, depositAmount).normalized();
        Double depositGlobalRate = HighPrecisionDecimal.fromRate(assetRecordDto.getDepositGlobalRate()).normalized();
        HighPrecisionDecimal borrowAmount = HighPrecisionDecimal.fromToken(assetRecordDto.getBorrowAmount(), token.getDecimals());
        Double borrowValue = HighPrecisionDecimal.multiply(price, borrowAmount).normalized();
        Double borrowGlobalRate = HighPrecisionDecimal.fromRate(assetRecordDto.getBorrowGlobalRate()).normalized();
        IAssetRecord lastAssetRecord = assetRecordCrudService.getLast(asset.getPublicKey());
        if (lastAssetRecord != null && lastAssetRecord.isSlate()) {
            lastAssetRecord.update(
                    assetRecordDto.getDepositApr(),
                    assetRecordDto.getBorrowApr(),
                    depositAmount.normalized(),
                    depositValue,
                    depositGlobalRate,
                    borrowAmount.normalized(),
                    borrowValue,
                    borrowGlobalRate);
            assetRecordCrudService.save(lastAssetRecord);
        } else {
            assetRecordCrudService.save(new AssetRecord(
                    asset,
                    assetRecordDto.getDepositApr(),
                    assetRecordDto.getBorrowApr(),
                    depositAmount.normalized(),
                    depositValue,
                    borrowAmount.normalized(),
                    borrowValue,
                    depositGlobalRate,
                    borrowGlobalRate));
        }
    }

    @Override
    public void execute(AddAssetRecordDto addAssetRecordDto)
            throws TokenPriceRecordNotFoundException, AssetNotFoundException {
        IAsset asset = assetCrudService.get(addAssetRecordDto.getPublicKey());
        execute(asset, addAssetRecordDto);
    }

}
