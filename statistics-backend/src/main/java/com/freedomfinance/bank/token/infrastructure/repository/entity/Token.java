package com.freedomfinance.bank.token.infrastructure.repository.entity;

import com.freedomfinance.bank.token.domain.models.IToken;
import jakarta.persistence.*;

import java.util.List;

@Entity
@Table(name = "token", schema = "public", indexes = {
        @Index(name = "token_symbol_index", columnList = "symbol", unique = true),
        @Index(name = "token_mint_index", columnList = "mint", unique = true)
})
public class Token implements IToken {

    @Id
    @Column(name="id")
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @Column(name="symbol", nullable = false, unique = true)
    private String symbol;

    @Column(name="mint", nullable = false, unique = true)
    private String mint;

    @Column(name="decimals", nullable = false)
    private Short decimals;

    @Column(name="logo_url", nullable = false)
    private String logoUrl;

    @OneToMany(mappedBy = "token", fetch = FetchType.LAZY, cascade = CascadeType.REMOVE, orphanRemoval = true)
    private List<TokenPriceRecord> records;

    public Token() {}

    public Token(
            String symbol,
            String mint,
            Short decimals,
            String logoUrl) {
        this.symbol = symbol;
        this.mint = mint;
        this.decimals = decimals;
        this.logoUrl = logoUrl;
    }

    @Override
    public Long getId() {
        return id;
    }

    @Override
    public String getSymbol() {
        return symbol;
    }

    @Override
    public String getMint() {
        return mint;
    }

    @Override
    public Short getDecimals() {
        return decimals;
    }

    @Override
    public String getLogoUrl() {
        return logoUrl;
    }

}
