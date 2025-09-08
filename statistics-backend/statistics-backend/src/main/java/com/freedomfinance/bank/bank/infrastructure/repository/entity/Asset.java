package com.freedomfinance.bank.bank.infrastructure.repository.entity;

import com.freedomfinance.bank.bank.domain.models.IAsset;
import com.freedomfinance.bank.bank.domain.models.IBank;
import com.freedomfinance.bank.token.domain.models.IToken;
import com.freedomfinance.bank.token.infrastructure.repository.entity.Token;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@NoArgsConstructor
@Table(name = "asset", schema = "public", indexes = {
        @Index(name = "asset_public_key_index", columnList = "public_key", unique = true),
        @Index(name = "asset_token_id_index", columnList = "token_id")
})
public class Asset implements IAsset {

    @Id
    @Column(name="id")
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @ManyToOne
    @JoinColumn(name="bank_id", nullable = false)
    private Bank bank;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="token_id", nullable = false)
    private Token token;

    @Column(name="public_key", nullable = false, unique = true)
    private String publicKey;

    @OneToMany(fetch = FetchType.LAZY, cascade = CascadeType.REMOVE, orphanRemoval = true, mappedBy = "asset")
    private List<AssetRecord> records;

    public Asset(IBank bank, IToken token, String publicKey) {
        this.bank = (Bank) bank;
        this.token = (Token) token;
        this.publicKey = publicKey;
        this.records = new ArrayList<>();
    }

}
