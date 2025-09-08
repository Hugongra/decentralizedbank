package com.freedomfinance.bank.common.controller.dtos;

import jakarta.validation.constraints.NotBlank;

public class AccountDto {
    @NotBlank(message = "Public key is required")
    private String publicKey;

    public AccountDto() {}

    public AccountDto(String publicKey) {
        this.publicKey = publicKey;
    }

    protected String getPublicKey() {
        return publicKey;
    }

}
