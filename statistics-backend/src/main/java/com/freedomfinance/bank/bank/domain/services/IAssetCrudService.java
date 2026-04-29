package com.freedomfinance.bank.bank.domain.services;

import com.freedomfinance.bank.bank.application.exceptions.AssetAlreadyExistsException;
import com.freedomfinance.bank.bank.application.exceptions.AssetNotFoundException;
import com.freedomfinance.bank.bank.domain.models.IAsset;

import java.util.List;

public interface IAssetCrudService {

    IAsset get(Long id) throws AssetNotFoundException;

    IAsset get(String publicKey) throws AssetNotFoundException;

    IAsset save(IAsset asset);

    default void checkAssetExistence(String publicKey) throws AssetAlreadyExistsException {
        try {
            get(publicKey);
            throw new AssetAlreadyExistsException(publicKey);
        } catch (AssetNotFoundException ignored) {}
    }

}
