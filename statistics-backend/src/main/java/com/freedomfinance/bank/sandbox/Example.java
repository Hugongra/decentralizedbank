package com.freedomfinance.bank.sandbox;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Entity
@Getter
@NoArgsConstructor
public class Example {

    @Id
    @Column(name="id")
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @Column(name="public_key", nullable = false)
    private String publicKey;

    @Column(name="decimals", nullable = false)
    private Short decimals;

    @OneToMany(mappedBy = "example", cascade = CascadeType.REMOVE, fetch = FetchType.LAZY)
    List<ExampleRecord> records;

    public Example(String publicKey, Short decimals) {
        this.publicKey = publicKey;
        this.decimals = decimals;
    }

}
