package com.freedomfinance.bank.bank.application.user_cases.impl;

import com.freedomfinance.bank.bank.application.exceptions.AssetAlreadyExistsException;
import com.freedomfinance.bank.bank.application.exceptions.BankNotFoundException;
import com.freedomfinance.bank.bank.application.user_cases.ICreateAsset;
import com.freedomfinance.bank.bank.domain.models.IBank;
import com.freedomfinance.bank.bank.domain.services.IAssetCrudService;
import com.freedomfinance.bank.bank.domain.services.IBankCrudService;
import com.freedomfinance.bank.bank.infrastructure.controller.dtos.request.CreateAssetDto;
import com.freedomfinance.bank.bank.infrastructure.repository.entity.Asset;
import com.freedomfinance.bank.log.application.exceptions.SmartContractLogNotFoundException;
import com.freedomfinance.bank.log.application.use_cases.IProcessSmartContractLog;
import com.freedomfinance.bank.token.application.exceptions.InvalidTokenMintException;
import com.freedomfinance.bank.token.application.exceptions.TokenNotFoundException;
import com.freedomfinance.bank.token.application.exceptions.TokenPriceRecordNotFoundException;
import com.freedomfinance.bank.token.application.use_cases.IAddTokenPriceRecord;
import com.freedomfinance.bank.token.domain.models.IToken;
import com.freedomfinance.bank.token.domain.services.ITokenCrudService;
import com.freedomfinance.bank.token.infrastructure.apis.coinmarketcap.services.ICoinmarketcapApiService;
import com.freedomfinance.bank.token.infrastructure.apis.spl_token.models.SplTokenDto;
import com.freedomfinance.bank.token.infrastructure.apis.spl_token.services.ISplTokenApiService;
import com.freedomfinance.bank.token.infrastructure.repository.entity.Token;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class CreateAsset implements ICreateAsset {

    private final IAssetCrudService assetCrudService;
    private final IBankCrudService bankCrudService;
    private final ITokenCrudService tokenCrudService;
    private final IAddTokenPriceRecord addTokenPriceRecord;
    private final IProcessSmartContractLog processSmartContractLog;
    private final ISplTokenApiService splTokenApiService;
    private final ICoinmarketcapApiService coinmarketcapApiService;

    @Autowired
    public CreateAsset(
            IAssetCrudService assetCrudService,
            IBankCrudService bankCrudService,
            ITokenCrudService tokenCrudService,
            IAddTokenPriceRecord addTokenPriceRecord,
            IProcessSmartContractLog processSmartContractLog,
            ISplTokenApiService splTokenApiService,
            ICoinmarketcapApiService coinmarketcapApiService) {
        this.assetCrudService = assetCrudService;
        this.bankCrudService = bankCrudService;
        this.tokenCrudService = tokenCrudService;
        this.addTokenPriceRecord = addTokenPriceRecord;
        this.processSmartContractLog = processSmartContractLog;
        this.splTokenApiService = splTokenApiService;
        this.coinmarketcapApiService = coinmarketcapApiService;
    }

    @Override
    @Transactional(rollbackOn = {SmartContractLogNotFoundException.class, TokenPriceRecordNotFoundException.class})
    public void execute(Long logId, CreateAssetDto createAssetDto)
            throws AssetAlreadyExistsException, BankNotFoundException, SmartContractLogNotFoundException, InvalidTokenMintException, TokenPriceRecordNotFoundException {
        assetCrudService.checkAssetExistence(createAssetDto.getPublicKey());
        IBank bank = bankCrudService.get(createAssetDto.getBankPublicKey());
        IToken token;
        try {
            token = tokenCrudService.getByMint(createAssetDto.getMintPublicKey());
        } catch (TokenNotFoundException e) {
            // Handle new Token
            SplTokenDto splTokenDto = splTokenApiService.fetchTokenData(createAssetDto.getMintPublicKey());
            if (splTokenDto == null) {
                throw new InvalidTokenMintException(createAssetDto.getMintPublicKey());
            }
            token = tokenCrudService.save(new Token(splTokenDto.getSymbol(), createAssetDto.getMintPublicKey(), splTokenDto.getDecimals(), splTokenDto.getLogoURI()));
            Double price = coinmarketcapApiService.fetchTokenPrice(token.getSymbol());
            addTokenPriceRecord.execute(token, price);
        }
        // Create asset
        assetCrudService.save(new Asset(
                bank,
                token,
                createAssetDto.getPublicKey()
        ));
        processSmartContractLog.execute(logId);
    }

}
