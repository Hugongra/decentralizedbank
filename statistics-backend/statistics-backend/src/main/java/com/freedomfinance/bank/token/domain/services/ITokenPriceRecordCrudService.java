package com.freedomfinance.bank.token.domain.services;

import com.freedomfinance.bank.token.application.exceptions.TokenPriceRecordNotFoundException;
import com.freedomfinance.bank.token.domain.models.ITokenPriceRecord;

public interface ITokenPriceRecordCrudService {
    ITokenPriceRecord get(Long tokenId, Long timestamp) throws TokenPriceRecordNotFoundException;

    ITokenPriceRecord getLast(Long tokenId);

    ITokenPriceRecord save(ITokenPriceRecord tokenPriceRecord);

}
