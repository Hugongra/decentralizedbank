package com.freedomfinance.bank.transaction.infrastructure.controller.dtos.response;

import com.freedomfinance.bank.transaction.domain.models.TransactionType;
import lombok.Getter;

import java.util.Date;

@Getter
public abstract class TransactionRto {

    private final Long id;

    private final TransactionType type;

    private final Long timestamp;

    protected TransactionRto(Long id, TransactionType type, Date timestamp) {
        this.id = id;
        this.type = type;
        this.timestamp = timestamp.getTime();
    }

}
