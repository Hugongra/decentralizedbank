package com.freedomfinance.bank.bank.infrastructure.controller.dtos.request;

import jakarta.validation.constraints.NotBlank;
public class CreateBankDto {

    @NotBlank(message = "Public key is required")
    private String publicKey;

    public CreateBankDto() {}

    public CreateBankDto(String publicKey) {
        this.publicKey = publicKey;
    }

    public String getPublicKey() {
        return publicKey;
    }

    public void setPublicKey(String publicKey) {
        this.publicKey = publicKey;
    }

}
