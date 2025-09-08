package com.freedomfinance.bank.bank.infrastructure.controller.dtos.response;

import com.freedomfinance.bank.bank.domain.models.IAsset;

public record AssetRto(String publicKey, Long tokenId, String symbol, String logoUrl) {
    static public AssetRto from(IAsset asset) {
        return new AssetRto(asset.getPublicKey(), asset.getToken().getId(), asset.getToken().getSymbol(), asset.getToken().getLogoUrl());
    }

}
