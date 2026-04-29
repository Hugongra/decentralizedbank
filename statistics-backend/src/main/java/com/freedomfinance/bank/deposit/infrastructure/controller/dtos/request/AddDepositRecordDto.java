package com.freedomfinance.bank.deposit.infrastructure.controller.dtos.request;

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
public class AddDepositRecordDto {

    @NotBlank(message = "Deposit public key is required")
    private String depositPublicKey;

    @Valid
    @NotNull(message = "Asset record is required")
    private AddAssetRecordDto assetRecord;

    @NotNull(message = "Amount is required")
    @Pattern(regexp = "^(0|[1-9]\\d*)$", message = "Amount must be a positive decimal number")
    private String amount;

    @NotNull(message = "Deposit rate index is required")
    @Pattern(regexp = "^(0|[1-9]\\d*)$", message = "Deposit rate index must be a positive decimal number")
    private String depositRateIndex;

    @NotNull(message = "Deposit amount is required")
    @Pattern(regexp = "^(0|[1-9]\\d*)$", message = "Deposit amount must be a positive decimal number")
    private String depositAmount;

}
