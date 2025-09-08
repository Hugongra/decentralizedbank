package com.freedomfinance.bank.transaction.infrastructure.repository.entity;

import com.freedomfinance.bank.customer.domain.models.ICustomer;
import com.freedomfinance.bank.customer.infrastructure.repository.entity.Customer;
import com.freedomfinance.bank.transaction.domain.models.ITransaction;
import com.freedomfinance.bank.transaction.domain.models.TransactionType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Date;

@Entity
@NoArgsConstructor
@Getter
@Inheritance(strategy = InheritanceType.TABLE_PER_CLASS)
@Table(name = "transaction", schema = "public", indexes = {
        @Index(name = "transaction_timestamp_index", columnList ="r_timestamp")
})
public abstract class Transaction implements ITransaction {

    @Id
    @Column(name="id")
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    private Customer customer;

    @Column(name="type", nullable = false)
    private TransactionType type;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name="r_timestamp", nullable = false)
    private Date timestamp;

    public Transaction(ICustomer customer, TransactionType transactionType) {
        this.customer = (Customer) customer;
        this.type = transactionType;
        timestamp = Date.from(Instant.now());
    }

}
