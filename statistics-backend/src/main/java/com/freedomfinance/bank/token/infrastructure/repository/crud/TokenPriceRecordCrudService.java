package com.freedomfinance.bank.token.infrastructure.repository.crud;

import com.freedomfinance.bank.token.domain.models.ITokenPriceRecord;
import com.freedomfinance.bank.token.domain.services.ITokenPriceRecordCrudService;
import com.freedomfinance.bank.token.infrastructure.repository.entity.TokenPriceRecord;
import com.freedomfinance.bank.token.infrastructure.repository.jpa.ITokenPriceRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class TokenPriceRecordCrudService implements ITokenPriceRecordCrudService {

    private final ITokenPriceRecordRepository repository;

    @Autowired
    public TokenPriceRecordCrudService(ITokenPriceRecordRepository repository) {
        this.repository = repository;
    }

    @Override
    public ITokenPriceRecord get(Long tokenId, Long timestamp) {
        return repository.findByTimestamp(tokenId, timestamp);
    }

    @Override
    public ITokenPriceRecord getLast(Long tokenId) {
        return repository.findLast(tokenId);
    }

    @Override
    public ITokenPriceRecord save(ITokenPriceRecord tokenPriceRecord) {
        return repository.save((TokenPriceRecord) tokenPriceRecord);
    }

}
