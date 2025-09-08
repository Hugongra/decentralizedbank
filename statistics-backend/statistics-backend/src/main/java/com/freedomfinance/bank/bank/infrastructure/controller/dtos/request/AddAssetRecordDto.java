package com.freedomfinance.bank.bank.infrastructure.controller.dtos.request;

import jakarta.validation.constraints.*;

public class AddAssetRecordDto {
    @NotBlank(message = "Asset public key is required")
    private String publicKey;
    @NotNull(message = "Deposit APR is required")
    @Min(value = 0, message = "Deposit APR must be greater than 0")
    @Max(value = 10000, message = "Deposit APR LTV must be less than 10000")
    private Short depositApr;
    @NotNull(message = "Borrow APR is required")
    @Min(value = 0, message = "Borrow APR must be greater than 0")
    @Max(value = 10000, message = "Borrow APR LTV must be less than 10000")
    private Short borrowApr;
    @NotBlank(message = "Deposit amount is required")
    @Pattern(regexp = "^(0|[1-9]\\d*)$", message = "Deposit amount must be a positive decimal number")
    private String depositAmount;
    @NotBlank(message = "Borrow amount is required")
    @Pattern(regexp = "^(0|[1-9]\\d*)$", message = "Borrow amount must be a positive decimal number")
    private String borrowAmount;
    @NotBlank(message = "Deposit global rate is required")
    @Pattern(regexp = "^(0|[1-9]\\d*)$", message = "Deposit global rate must be a positive decimal number")
    private String depositGlobalRate;
    @NotBlank(message = "Borrow global rate is required")
    @Pattern(regexp = "^(0|[1-9]\\d*)$", message = "Borrow global rate amount must be a positive decimal number")
    private String borrowGlobalRate;

    public AddAssetRecordDto() {}

    public AddAssetRecordDto(
            String publicKey,
            Short depositApr,
            Short borrowApr,
            String depositAmount,
            String borrowAmount,
            String depositGlobalRate,
            String borrowGlobalRate) {
        this.publicKey = publicKey;
        this.depositApr = depositApr;
        this.borrowApr = borrowApr;
        this.depositAmount = depositAmount;
        this.borrowAmount = borrowAmount;
        this.depositGlobalRate = depositGlobalRate;
        this.borrowGlobalRate = borrowGlobalRate;
    }

    public String getPublicKey() {
        return publicKey;
    }

    public Short getDepositApr() {
        return depositApr;
    }

    public Short getBorrowApr() {
        return borrowApr;
    }

    public String getDepositAmount() {
        return depositAmount;
    }

    public String getBorrowAmount() {
        return borrowAmount;
    }
    public String getDepositGlobalRate() {
        return depositGlobalRate;
    }

    public String getBorrowGlobalRate() {
        return borrowGlobalRate;
    }

}
