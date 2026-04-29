package com.freedomfinance.bank.deposit.infrastructure.controller.dtos.response;

import com.freedomfinance.bank.deposit.domain.models.IDeposit;

public record DepositRto(Long id, String publicKey, String assetPublicKey) {
    public static DepositRto from(IDeposit deposit) {
        return new DepositRto(deposit.getId(), deposit.getPublicKey(), deposit.getAsset().getPublicKey());
    }

}
