package com.freedomfinance.bank.transaction.infrastructure.controller.dtos.response;

import com.freedomfinance.bank.token.infrastructure.dtos.TokenRto;
import com.freedomfinance.bank.transaction.domain.models.IBorrowRepayTransaction;
import lombok.Getter;

@Getter
public class BorrowRepayTransactionRto extends TransactionRto {

    private final TokenRto borrowToken;

    private final TokenRto collateralToken;

    private final Double borrowAmount;

    private final Double borrowValue;

    private final Double collateralAmount;

    private final Double collateralValue;

    public BorrowRepayTransactionRto(IBorrowRepayTransaction transaction) {
        super(transaction.getId(), transaction.getType(), transaction.getTimestamp());
        this.borrowToken = new TokenRto(transaction.getBorrowAsset().getToken());
        this.collateralToken = new TokenRto(transaction.getCollateralAsset().getToken());
        this.borrowAmount = transaction.getBorrowAmount();
        this.borrowValue = transaction.getBorrowValue();
        this.collateralAmount = transaction.getCollateralAmount();
        this.collateralValue = transaction.getCollateralValue();
    }

}
