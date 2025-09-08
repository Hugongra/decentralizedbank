package com.freedomfinance.bank.bank.application.user_cases;

import com.freedomfinance.bank.bank.application.exceptions.AssetAlreadyExistsException;
import com.freedomfinance.bank.bank.application.exceptions.BankNotFoundException;
import com.freedomfinance.bank.bank.infrastructure.controller.dtos.request.CreateAssetDto;
import com.freedomfinance.bank.log.application.exceptions.SmartContractLogNotFoundException;
import com.freedomfinance.bank.token.application.exceptions.InvalidTokenMintException;
import com.freedomfinance.bank.token.application.exceptions.TokenPriceRecordNotFoundException;

public interface ICreateAsset {
    void execute(Long logId, CreateAssetDto createAssetDto)
            throws AssetAlreadyExistsException, BankNotFoundException,
            SmartContractLogNotFoundException, InvalidTokenMintException, TokenPriceRecordNotFoundException;
}
