package com.freedomfinance.bank.common.controller.dtos;

import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.Date;

@NoArgsConstructor
@Getter
public class RecordRto <T> {

    private T value;

    private Long timestamp;

    public RecordRto(T value, Date timestamp) {
        this.value = value;
        this.timestamp = timestamp.getTime();
    }

}
