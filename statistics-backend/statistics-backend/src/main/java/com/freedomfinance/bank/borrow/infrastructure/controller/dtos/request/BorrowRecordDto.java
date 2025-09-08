package com.freedomfinance.bank.borrow.infrastructure.controller.dtos.request;

import com.freedomfinance.bank.bank.infrastructure.controller.dtos.request.AddAssetRecordDto;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Getter
public class BorrowRecordDto {

    @NotBlank(message = "Borrow public key is required")
    private String borrowPublicKey;

    @NotBlank(message = "User public key is required")
    private String userPublicKey;

    @NotNull(message = "Amount is required")
    @Pattern(regexp = "^(0|[1-9]\\d*)$", message = "Amount must be a positive decimal number")
    private String amount;

    @Valid
    @NotNull(message = "Borrow asset record is required")
    private AddAssetRecordDto borrowAssetRecord;

    @Valid
    @NotNull(message = "Collateral asset record is required")
    private AddAssetRecordDto collateralAssetRecord;

    @NotNull(message = "Borrow amount is required")
    @Pattern(regexp = "^(0|[1-9]\\d*)$", message = "Borrow amount must be a positive decimal number")
    private String borrowAmount;

    @NotNull(message = "Borrow rate index is required")
    @Pattern(regexp = "^(0|[1-9]\\d*)$", message = "Borrow rate index must be a positive decimal number")
    private String borrowRateIndex;

    @NotNull(message = "Collateral amount is required")
    @Pattern(regexp = "^(0|[1-9]\\d*)$", message = "Collateral amount must be a positive decimal number")
    private String collateralAmount;

}
