package com.freedomfinance.bank.bank.application.user_cases;

import com.freedomfinance.bank.bank.application.exceptions.AssetNotFoundException;
import com.freedomfinance.bank.bank.domain.models.IAsset;
import com.freedomfinance.bank.bank.infrastructure.controller.dtos.request.AddAssetRecordDto;
import com.freedomfinance.bank.token.application.exceptions.TokenPriceRecordNotFoundException;

public interface IAddAssetRecord {

    void execute(IAsset asset, AddAssetRecordDto addAssetRecordDto) throws TokenPriceRecordNotFoundException;

    void execute(AddAssetRecordDto addAssetRecordDto)
            throws TokenPriceRecordNotFoundException, AssetNotFoundException;

}
