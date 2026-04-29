package com.freedomfinance.bank.customer.infrastructure.repository.entity;

import com.freedomfinance.bank.customer.domain.models.ICustomer;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Date;

@Entity
@Getter
@NoArgsConstructor
@Table(name = "customer", schema = "public", indexes = {
        @Index(name = "customer_user_public_key_index", columnList = "user_public_key", unique = true)
})
public class Customer implements ICustomer {

    @Id
    @Column(name="id")
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @Column(name="user_public_key", nullable = false, unique = true)
    private String userPublicKey;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name="r_timestamp", nullable = false)
    private Date timestamp;

    public Customer(String userPublicKey) {
        this.userPublicKey = userPublicKey;
        timestamp = Date.from(Instant.now());
    }

}
