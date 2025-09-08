package com.freedomfinance.bank.bank.infrastructure.repository.entity;

import com.freedomfinance.bank.bank.domain.models.IAsset;
import com.freedomfinance.bank.bank.domain.models.IBank;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity
@NoArgsConstructor
@Table(name = "bank", schema = "public", indexes = {
        @Index(name = "bank_public_key_index", columnList = "public_key", unique = true)
})
public class Bank implements IBank {

    @Id
    @Column(name="id")
    @Getter
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @Getter
    @Column(name="public_key", nullable = false, unique = true)
    private String publicKey;

    @OneToMany(mappedBy = "bank", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<Asset> assets;

    public Bank(String publicKey) {
        this.id = null;
        this.publicKey = publicKey;
        this.assets = new ArrayList<>();
    }

    @Override
    public List<IAsset> getAssets() {
        return assets.stream()
                .map(i -> (IAsset) i)
                .toList();
    }

}
