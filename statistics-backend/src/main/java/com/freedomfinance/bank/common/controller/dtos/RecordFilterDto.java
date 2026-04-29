package com.freedomfinance.bank.common.controller.dtos;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.temporal.ChronoUnit;

@AllArgsConstructor
@NoArgsConstructor
@Getter
public class RecordFilterDto {

    @NotNull
    private ChronoUnit timeUnit;

}
