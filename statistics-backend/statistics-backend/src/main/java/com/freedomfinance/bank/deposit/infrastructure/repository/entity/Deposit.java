package com.freedomfinance.bank.deposit.infrastructure.repository.entity;

import com.freedomfinance.bank.bank.domain.models.IAsset;
import com.freedomfinance.bank.bank.infrastructure.repository.entity.Asset;
import com.freedomfinance.bank.customer.domain.models.ICustomer;
import com.freedomfinance.bank.customer.infrastructure.repository.entity.Customer;
import com.freedomfinance.bank.deposit.domain.models.IDeposit;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Entity
@NoArgsConstructor
@Table(name = "deposit", schema = "public", indexes = {
        @Index(name = "deposit_public_key_index", columnList = "public_key", unique = true)
})
public class Deposit implements IDeposit {

    @Id
    @Getter
    @Column(name="id")
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @Getter
    @Column(name="public_key", nullable = false, unique = true)
    private String publicKey;

    @Getter
    @ManyToOne(fetch = FetchType.LAZY)
    private Asset asset;

    @Getter
    @ManyToOne(fetch = FetchType.LAZY)
    private Customer customer;

    @OneToMany(fetch = FetchType.LAZY, cascade = CascadeType.REMOVE, orphanRemoval = true, mappedBy = "deposit")
    private List<DepositRecord> records;

    public Deposit(String publicKey, IAsset asset, ICustomer customer) {
        this.publicKey = publicKey;
        this.asset = (Asset) asset;
        this.customer = (Customer) customer;
    }

}
