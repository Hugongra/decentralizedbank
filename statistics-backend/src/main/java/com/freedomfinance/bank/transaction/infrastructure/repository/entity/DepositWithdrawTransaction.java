package com.freedomfinance.bank.transaction.infrastructure.repository.entity;

import com.freedomfinance.bank.bank.domain.models.IAsset;
import com.freedomfinance.bank.bank.infrastructure.repository.entity.Asset;
import com.freedomfinance.bank.customer.domain.models.ICustomer;
import com.freedomfinance.bank.transaction.domain.models.IDepositWithdrawTransaction;
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
public class DepositWithdrawTransaction extends Transaction implements IDepositWithdrawTransaction {

    @ManyToOne(fetch = FetchType.LAZY)
    private Asset depositAsset;

    @Column(name = "deposit_amount", nullable = false)
    private Double depositAmount;

    @Column(name = "deposit_value", nullable = false)
    private Double depositValue;

    public DepositWithdrawTransaction(ICustomer customer, TransactionType type, IAsset depositAsset, Double depositAmount, Double depositValue) {
        super(customer, type);
        this.depositAsset = (Asset) depositAsset;
        this.depositAmount = depositAmount;
        this.depositValue = depositValue;
    }

}
