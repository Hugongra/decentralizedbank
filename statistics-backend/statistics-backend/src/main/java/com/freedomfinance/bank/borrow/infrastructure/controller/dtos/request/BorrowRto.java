package com.freedomfinance.bank.borrow.infrastructure.controller.dtos.request;


import com.freedomfinance.bank.borrow.domain.models.IBorrow;
public record BorrowRto(Long id, String publicKey, String assetPublicKey) {
    public static BorrowRto from(IBorrow borrow) {
        return new BorrowRto(borrow.getId(), borrow.getPublicKey(), borrow.getBorrowAsset().getPublicKey());
    }

}
