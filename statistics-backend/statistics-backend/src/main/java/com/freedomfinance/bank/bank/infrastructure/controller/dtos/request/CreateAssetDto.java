package com.freedomfinance.bank.bank.infrastructure.controller.dtos.request;

import jakarta.validation.constraints.*;

public class CreateAssetDto extends AddAssetRecordDto {
    @NotBlank(message = "Mint Public key is required")
    private String mintPublicKey;
    @NotBlank(message = "Bank public key is required")
    private String bankPublicKey;

    public CreateAssetDto() {}

    public CreateAssetDto(String publicKey,
                          String mintPublicKey,
                          String bankPublicKey,
                          Short depositApr,
                          Short borrowApr,
                          String depositAmount,
                          String borrowAmount,
                          String depositGlobalRate,
                          String borrowGlobalRate) {
        super(publicKey, depositApr, borrowApr, depositAmount, borrowAmount, depositGlobalRate, borrowGlobalRate);
        this.mintPublicKey = mintPublicKey;
        this.bankPublicKey = bankPublicKey;
    }

    public String getMintPublicKey() {
        return mintPublicKey;
    }

    public String getBankPublicKey() {
        return bankPublicKey;
    }

}
