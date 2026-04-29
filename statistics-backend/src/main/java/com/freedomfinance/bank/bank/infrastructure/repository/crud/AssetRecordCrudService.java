package com.freedomfinance.bank.bank.infrastructure.repository.crud;

import com.freedomfinance.bank.bank.domain.models.IAssetRecord;
import com.freedomfinance.bank.bank.domain.services.IAssetRecordCrudService;
import com.freedomfinance.bank.bank.infrastructure.repository.entity.AssetRecord;
import com.freedomfinance.bank.bank.infrastructure.repository.jpa.IAssetRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.List;

@Service
public class AssetRecordCrudService implements IAssetRecordCrudService {

    private final IAssetRecordRepository repository;

    @Autowired
    public AssetRecordCrudService(IAssetRecordRepository repository) {
        this.repository = repository;
    }

    @Override
    public IAssetRecord getLast(String assetPublicKey) {
        return repository.findLast(assetPublicKey);
    }

    @Override
    public List<IAssetRecord> findByDate(String assetPublicKey, ChronoUnit unit) {
        return repository.findByDate(assetPublicKey, unit).stream()
                .map(record -> (IAssetRecord) record)
                .toList();
    }

    @Override
    public IAssetRecord save(IAssetRecord record) {
        return repository.save((AssetRecord) record);
    }

}
