package com.freedomfinance.bank.token.application.use_cases.impl;

import com.freedomfinance.bank.token.application.use_cases.IAddTokenPriceRecord;
import com.freedomfinance.bank.token.domain.models.IToken;
import com.freedomfinance.bank.token.domain.models.ITokenPriceRecord;
import com.freedomfinance.bank.token.domain.services.ITokenPriceRecordCrudService;
import com.freedomfinance.bank.token.infrastructure.repository.entity.TokenPriceRecord;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class AddTokenPriceRecord implements IAddTokenPriceRecord {
    private final ITokenPriceRecordCrudService tokenPriceRecordCrudService;

    @Autowired
    public AddTokenPriceRecord(
            ITokenPriceRecordCrudService tokenPriceRecordCrudService) {
        this.tokenPriceRecordCrudService = tokenPriceRecordCrudService;
    }

    @Override
    public void execute(IToken token, Double price) {
        ITokenPriceRecord lastRecord = tokenPriceRecordCrudService.getLast(token.getId());
        if ((lastRecord == null || !lastRecord.getPrice().equals(price) && price > 0.0)) {
            tokenPriceRecordCrudService.save(new TokenPriceRecord(token, price));
        }
    }

}
