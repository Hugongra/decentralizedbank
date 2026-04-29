package com.freedomfinance.bank.transaction.infrastructure.controller.dtos.request;

import com.freedomfinance.bank.common.controller.dtos.PaginatorDto;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class TransactionFilterDto extends PaginatorDto {

    @NotBlank
    private String userPublicKey;

    private Long startDate;

    private Long endDate;

}
