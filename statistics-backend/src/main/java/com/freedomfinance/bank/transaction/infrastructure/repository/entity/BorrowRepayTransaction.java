package com.freedomfinance.bank.transaction.infrastructure.repository.entity;

import com.freedomfinance.bank.bank.domain.models.IAsset;
import com.freedomfinance.bank.bank.infrastructure.repository.entity.Asset;
import com.freedomfinance.bank.customer.domain.models.ICustomer;
import com.freedomfinance.bank.transaction.domain.models.IBorrowRepayTransaction;
import com.freedomfinance.bank.transaction.domain.models.TransactionType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ManyToOne;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor
public class BorrowRepayTransaction extends Transaction implements IBorrowRepayTransaction {

    @ManyToOne(fetch = FetchType.LAZY)
    private Asset borrowAsset;

    @ManyToOne(fetch = FetchType.LAZY)
    private Asset collateralAsset;

    @Column(name = "borrow_amount", nullable = false)
    private Double borrowAmount;

    @Column(name = "borrow_value", nullable = false)
    private Double borrowValue;

    @Column(name = "collateral_amount", nullable = false)
    private Double collateralAmount;

    @Column(name = "collateral_value", nullable = false)
    private Double collateralValue;

    public BorrowRepayTransaction(ICustomer customer, TransactionType type, IAsset borrowAsset, IAsset collateralAsset,
                                  Double borrowAmount, Double borrowValue, Double collateralAmount, Double collateralValue) {
        super(customer, type);
        this.borrowAsset = (Asset) borrowAsset;
        this.collateralAsset = (Asset) collateralAsset;
        this.borrowAmount = borrowAmount;
        this.borrowValue = borrowValue;
        this.collateralAmount = collateralAmount;
        this.collateralValue = collateralValue;
    }

}
