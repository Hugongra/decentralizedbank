package com.freedomfinance.bank.transaction.infrastructure.controller.dtos.response;

import com.freedomfinance.bank.token.infrastructure.dtos.TokenRto;
import com.freedomfinance.bank.transaction.domain.models.IDepositWithdrawTransaction;
import lombok.Getter;

@Getter
public class DepositWithdrawTransactionRto extends TransactionRto {

    private final Double depositAmount;

    private final Double depositValue;

    private final TokenRto depositToken;

    public DepositWithdrawTransactionRto(IDepositWithdrawTransaction transaction) {
        super(transaction.getId(), transaction.getType(), transaction.getTimestamp());
        this.depositAmount = transaction.getDepositAmount();
        this.depositValue = transaction.getDepositValue();
        this.depositToken = new TokenRto(transaction.getDepositAsset().getToken());
    }

}