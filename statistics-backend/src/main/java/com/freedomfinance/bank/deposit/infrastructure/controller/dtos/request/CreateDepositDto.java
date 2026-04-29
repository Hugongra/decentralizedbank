package com.freedomfinance.bank.deposit.infrastructure.controller.dtos.request;

import com.freedomfinance.bank.bank.infrastructure.controller.dtos.request.AddAssetRecordDto;
import jakarta.validation.constraints.NotBlank;

public class CreateDepositDto {

    @NotBlank(message = "Public key is required")
    private String publicKey;

    @NotBlank(message = "Asset public key is required")
    private String assetPublicKey;

    @NotBlank(message = "User public key is required")
    private String userPublicKey;

    public CreateDepositDto() {}

    public CreateDepositDto(String publicKey, AddAssetRecordDto assetRecord, String userPublicKey) {
        this.publicKey = publicKey;
        this.assetPublicKey = assetRecord.getPublicKey();
        this.userPublicKey = userPublicKey;
    }

    public String getPublicKey() {
        return publicKey;
    }

    public String getAssetPublicKey() {
        return assetPublicKey;
    }

    public String getUserPublicKey() {
        return userPublicKey;
    }

}
