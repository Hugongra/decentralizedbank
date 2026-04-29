package com.freedomfinance.bank.borrow.infrastructure.repository.entity;

import com.freedomfinance.bank.bank.domain.models.IAsset;
import com.freedomfinance.bank.bank.infrastructure.repository.entity.Asset;
import com.freedomfinance.bank.borrow.domain.models.IBorrow;
import com.freedomfinance.bank.customer.domain.models.ICustomer;
import com.freedomfinance.bank.customer.infrastructure.repository.entity.Customer;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Entity
@NoArgsConstructor
@Table(name = "borrow", schema = "public", indexes = {
        @Index(name = "borrow_public_key_index", columnList = "public_key", unique = true)
})
public class Borrow implements IBorrow {

    @Id
    @Column(name="id")
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Getter
    private Long id;

    @Column(name="public_key", nullable = false, unique = true)
    @Getter
    private String publicKey;

    @ManyToOne(fetch = FetchType.LAZY)
    @Getter
    private Asset borrowAsset;

    @ManyToOne(fetch = FetchType.LAZY)
    @Getter
    private Asset collateralAsset;

    @ManyToOne(fetch = FetchType.LAZY)
    @Getter
    private Customer customer;

    @OneToMany(fetch = FetchType.LAZY, cascade = CascadeType.REMOVE, orphanRemoval = true, mappedBy = "borrow")
    private List<BorrowRecord> records;

    public Borrow(String publicKey, IAsset borrowAsset, IAsset collateralAsset, ICustomer customer) {
        this.publicKey = publicKey;
        this.borrowAsset = (Asset) borrowAsset;
        this.collateralAsset = (Asset) collateralAsset;
        this.customer = (Customer) customer;
    }

}
