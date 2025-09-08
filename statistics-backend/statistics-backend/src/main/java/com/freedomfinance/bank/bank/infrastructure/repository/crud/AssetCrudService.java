package com.freedomfinance.bank.bank.infrastructure.repository.crud;

import com.freedomfinance.bank.bank.application.exceptions.AssetNotFoundException;
import com.freedomfinance.bank.bank.domain.models.IAsset;
import com.freedomfinance.bank.bank.domain.services.IAssetCrudService;
import com.freedomfinance.bank.bank.infrastructure.repository.entity.Asset;
import com.freedomfinance.bank.bank.infrastructure.repository.jpa.IAssetRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class AssetCrudService implements IAssetCrudService {

    private final IAssetRepository repository;

    @Autowired
    public AssetCrudService(IAssetRepository repository) {
        this.repository = repository;
    }

    @Override
    public IAsset get(Long id) throws AssetNotFoundException {
        IAsset asset = repository.findById(id).orElse(null);
        if (asset == null) {
            throw new AssetNotFoundException(id);
        }
        return asset;
    }

    @Override
    public IAsset get(String publicKey) throws AssetNotFoundException {
        Asset asset = repository.findByPublicKey(publicKey);
        if (asset == null) {
            throw new AssetNotFoundException(publicKey);
        }
        return asset;
    }

    @Override
    public IAsset save(IAsset asset) {
        return repository.save((Asset) asset);
    }

}
