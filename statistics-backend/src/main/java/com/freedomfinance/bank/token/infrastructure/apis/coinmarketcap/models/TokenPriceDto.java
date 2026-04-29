package com.freedomfinance.bank.token.infrastructure.apis.coinmarketcap.models;

public class TokenPriceDto {

    private String symbol;

    private Double price;

    public TokenPriceDto() {}

    public TokenPriceDto(String symbol, Double price) {
        this.symbol = symbol;
        this.price = price;
    }

    public String getSymbol() {
        return symbol;
    }

    public Double getPrice() {
        return price;
    }

}
