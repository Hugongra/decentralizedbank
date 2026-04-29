package com.freedomfinance.bank.token.infrastructure.apis.spl_token.models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class SplTokenDto {

    private Long chainId;

    private String address;

    private String symbol;

    private String name;

    private Short decimals;

    private String logoURI;

    private List<String> tags;

    public SplTokenDto() {}

    public SplTokenDto(
            Long chainId,
            String address,
            String symbol,
            String name,
            Short decimals,
            String logoURI,
            List<String> tags) {
        this.chainId = chainId;
        this.symbol = symbol;
        this.name = name;
        this.decimals = decimals;
        this.logoURI = logoURI;
        this.tags = tags;
    }

    public Long getChainId() {
        return chainId;
    }

    public String getAddress() {
        return address;
    }

    public String getSymbol() {
        return symbol;
    }

    public String getName() {
        return name;
    }

    public Short getDecimals() {
        return decimals;
    }

    public String getLogoURI() {
        return logoURI;
    }

    public List<String> getTags() {
        return tags;
    }
}
